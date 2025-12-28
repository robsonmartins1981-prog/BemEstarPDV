
import React, { useState, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Supplier, InventoryLot, Expense, NFeData, NFeItem, NFeItemStatus } from '../../types';
import Button from '../shared/Button';
import ProductLinkModal from './ProductLinkModal';
import { Upload, Link, PlusCircle, CheckCircle, AlertTriangle, ChevronsRight, X, FileQuestion, BadgeCheck, Pencil, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- FUNÇÕES UTILITÁRIAS ---
const normalizeProductName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\b(kg|g|ml|l|un|unid|unidade|saco|caixa|pacote|pct|cx)\b/g, '')
    .replace(/\d+[.,]?\d*/g, '')
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// --- SUB-COMPONENTES DA UI ---
const StatusBadge: React.FC<{ status: NFeItemStatus }> = ({ status }) => {
    const statusConfig = {
        LINKED: { text: 'Vinculado', color: 'green', icon: BadgeCheck },
        UNLINKED: { text: 'Não Vinculado', color: 'yellow', icon: FileQuestion },
        NEW: { text: 'Novo Produto', color: 'orange', icon: PlusCircle },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/50 dark:text-${config.color}-300`}>
            <Icon size={14} />
            {config.text}
        </span>
    );
};


// --- COMPONENTE PRINCIPAL ---
const NFeImport: React.FC = () => {
    const [nfeData, setNfeData] = useState<NFeData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [linkingItem, setLinkingItem] = useState<{ item: NFeItem; index: number } | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setNfeData(null);
        setSuccess(null);
        setSelectedItems(new Set());

        try {
            const allDbProducts = await db.getAll('products');
            const productMapById = new Map<string, Product>(allDbProducts.map(p => [p.id, p]));
            const productMapByNormalizedName = new Map<string, Product>(allDbProducts.map(p => [normalizeProductName(p.name), p]));
            
            const fileContent = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(fileContent, 'application/xml');
            
            if (xmlDoc.querySelector('parsererror')) throw new Error('Arquivo XML inválido ou mal formatado.');

            const getTagValue = (parent: Element, tagName: string) => parent.querySelector(tagName)?.textContent || '';
            const ide = xmlDoc.querySelector('ide');
            const emit = xmlDoc.querySelector('emit');
            const prods = xmlDoc.querySelectorAll('det');
            const total = xmlDoc.querySelector('total > ICMSTot > vNF');
            
            if (!emit || !prods.length || !total || !ide) throw new Error('XML não parece ser uma NF-e válida.');

            const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

            const parsedItems: NFeItem[] = Array.from(prods).map((p): NFeItem => {
                const prodNode = p.querySelector('prod')!;
                
                const code = getTagValue(prodNode, 'cProd');
                const name = getTagValue(prodNode, 'xProd');
                const ncm = getTagValue(prodNode, 'NCM');
                const quantity = parseFloat(getTagValue(prodNode, 'qCom'));
                const unitPrice = parseFloat(getTagValue(prodNode, 'vUnCom'));
                const totalPrice = parseFloat(getTagValue(prodNode, 'vProd'));

                const foundProduct = productMapById.get(code) || productMapByNormalizedName.get(normalizeProductName(name));
                
                const baseItemData = {
                    code, name, ncm, quantity, unitPrice, totalPrice,
                    expirationDate: nextYear,
                    conversionFactor: 1,
                };

                if (foundProduct) {
                    return {
                        ...baseItemData,
                        status: 'LINKED',
                        linkedProductDetails: foundProduct,
                    };
                } else {
                    return {
                        ...baseItemData,
                        status: 'UNLINKED',
                        linkedProductDetails: undefined,
                    };
                }
            });

            setNfeData({
                supplier: { cnpj: getTagValue(emit, 'CNPJ'), name: getTagValue(emit, 'xNome') },
                items: parsedItems,
                totalAmount: parseFloat(total.textContent || '0'),
                issueDate: new Date(getTagValue(ide, 'dhEmi')),
            });

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemStatusChange = (index: number, newStatus: NFeItemStatus) => {
        if (!nfeData) return;
        const newItems = [...nfeData.items];
        newItems[index].status = newStatus;
        if (newStatus !== 'LINKED') {
            newItems[index].linkedProductDetails = undefined;
        }
        setNfeData({ ...nfeData, items: newItems });
    };
    
    const handleSelectionChange = (index: number) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleBatchMarkAsNew = () => {
        if (!nfeData) return;
        const newItems = nfeData.items.map((item, index) => {
            if (selectedItems.has(index) && item.status === 'UNLINKED') {
                return { ...item, status: 'NEW' as NFeItemStatus };
            }
            return item;
        });
        setNfeData({ ...nfeData, items: newItems });
        setSelectedItems(new Set());
    };
    
    const handleOpenLinkModal = (item: NFeItem, index: number) => {
        setLinkingItem({ item, index });
    };

    const handleProductLink = (linkedProduct: Product) => {
        if (!nfeData || linkingItem === null) return;

        const newItems = [...nfeData.items];
        const itemToUpdate = newItems[linkingItem.index];

        itemToUpdate.status = 'LINKED';
        itemToUpdate.linkedProductDetails = linkedProduct;
        
        setNfeData({ ...nfeData, items: newItems });
        setLinkingItem(null); 
    };
    
    const handleConfirmImport = async () => {
        if (!nfeData) return;
        if (nfeData.items.some(p => p.status === 'UNLINKED')) {
            setError("Todos os itens devem ser vinculados ou marcados como 'Novo Produto' antes de importar.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const tx = db.transaction(['products', 'inventoryLots', 'suppliers', 'expenses'], 'readwrite');
            const productsStore = tx.objectStore('products');
            const lotsStore = tx.objectStore('inventoryLots');
            const suppliersStore = tx.objectStore('suppliers');
            const expensesStore = tx.objectStore('expenses');
            
            let supplierId = '';
            // Buscamos pelo índice de CNPJ
            const existingSupplier = await suppliersStore.index('cnpj').get(nfeData.supplier.cnpj!);
            if (existingSupplier) {
                supplierId = existingSupplier.id;
            } else {
                supplierId = uuidv4();
                // Usamos put para garantir idempotência caso ocorra retry do Job
                await suppliersStore.put({ id: supplierId, cnpj: nfeData.supplier.cnpj!, name: nfeData.supplier.name! });
            }

            for (const item of nfeData.items) {
                let productToUpdate: Product | undefined;

                if (item.status === 'NEW') {
                    const existingProduct = await productsStore.get(item.code);
                    if (existingProduct) {
                         productToUpdate = existingProduct;
                    } else {
                        const newProduct: Product = {
                            id: item.code,
                            name: item.name,
                            price: item.unitPrice * 1.5,
                            costPrice: item.unitPrice / item.conversionFactor,
                            isBulk: false,
                            stock: 0,
                            ncm: item.ncm,
                            image: 'https://picsum.photos/seed/newproduct/200'
                        };
                        await productsStore.put(newProduct);
                        productToUpdate = newProduct;
                    }
                } else if (item.status === 'LINKED') {
                    productToUpdate = await productsStore.get(item.linkedProductDetails!.id);
                }
                
                if (productToUpdate) {
                    const convertedQuantity = item.quantity * item.conversionFactor;
                    const convertedUnitPrice = item.unitPrice / item.conversionFactor;

                    productToUpdate.costPrice = convertedUnitPrice;
                    productToUpdate.stock = (productToUpdate.stock || 0) + convertedQuantity;
                    productToUpdate.supplierId = supplierId; 
                    await productsStore.put(productToUpdate);

                    await lotsStore.put({
                        id: uuidv4(),
                        productId: productToUpdate.id,
                        supplierId: supplierId,
                        quantity: convertedQuantity,
                        entryDate: new Date(),
                        expirationDate: new Date(item.expirationDate),
                        costPrice: convertedUnitPrice
                    });
                }
            }
            
            await expensesStore.put({
                id: uuidv4(),
                description: `Compra NF-e - Fornecedor: ${nfeData.supplier.name}`,
                amount: nfeData.totalAmount,
                supplierId,
                dueDate: nfeData.issueDate,
                status: 'PENDING'
            });

            await tx.done;
            setSuccess(`Importação concluída! ${nfeData.items.length} itens processados.`);
            setNfeData(null);

        } catch(err) {
            console.error("Erro detalhado na importação:", err);
            setError(`Falha na importação: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const unlinkedCount = useMemo(() => nfeData?.items.filter(i => i.status === 'UNLINKED').length || 0, [nfeData]);

    const unlinkedIndices = useMemo(() => {
        if (!nfeData) return [];
        return nfeData.items
            .map((item, index) => (item.status === 'UNLINKED' ? index : -1))
            .filter(index => index !== -1);
    }, [nfeData]);

    const areAllSelected = useMemo(() => {
        if (unlinkedIndices.length === 0) return false;
        return unlinkedIndices.every(index => selectedItems.has(index));
    }, [unlinkedIndices, selectedItems]);

    const handleSelectAllChange = () => {
        if (areAllSelected) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(unlinkedIndices));
        }
    };

    const handleConversionFactorChange = (index: number, factor: string) => {
        if (!nfeData) return;
        const newItems = [...nfeData.items];
        const newFactor = parseFloat(factor.replace(',', '.'));
        newItems[index].conversionFactor = isNaN(newFactor) || newFactor <= 0 ? 1 : newFactor;
        setNfeData({ ...nfeData, items: newItems });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-2">Importar Compra (NF-e XML)</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Carregue o arquivo para dar entrada automática nos produtos e converter unidades de compra para venda.</p>
                <div className="flex items-center gap-4">
                     <label htmlFor="xml-upload" className="flex-grow cursor-pointer">
                        <div className="flex items-center justify-center w-full px-4 py-3 text-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 hover:border-theme-primary dark:hover:border-theme-primary transition-colors">
                            <Upload className="w-5 h-5 mr-2 text-gray-500"/>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{nfeData ? 'Arquivo Carregado!' : 'Clique aqui para selecionar o arquivo XML'}</span>
                        </div>
                        <input id="xml-upload" type="file" accept=".xml" onChange={handleFileChange} className="hidden"/>
                    </label>
                    {nfeData && <Button variant="danger" onClick={() => setNfeData(null)}><X className="mr-1"/>Cancelar</Button>}
                </div>
            </div>

            {isLoading && <p className="text-center">Processando XML...</p>}
            {error && <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg flex items-center gap-2"><AlertTriangle size={20}/> {error}</div>}
            {success && <div className="p-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-200 rounded-lg flex items-center gap-2"><CheckCircle size={20}/> {success}</div>}

            {nfeData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-4 border-b dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Itens da Nota Fiscal ({nfeData.items.length})</h3>
                             <div className="text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md">
                                <strong>Fornecedor:</strong> {nfeData.supplier.name}
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-yellow-600"/>
                            <span>O <strong>Fator de Conversão</strong> define quantas unidades de venda existem em 1 unidade de compra da nota. (Ex: 1 Cx c/ 12 un -> Fator: 12)</span>
                        </div>
                    </div>
                    
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-2 w-8 text-center">
                                        <input 
                                            type="checkbox"
                                            checked={areAllSelected}
                                            onChange={handleSelectAllChange}
                                            disabled={unlinkedIndices.length === 0}
                                            className="cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-2 text-left">Item na NF-e (Fornecedor)</th>
                                    <th className="p-2 text-center w-32">Fator de Conversão</th>
                                    <th className="p-2 text-left">Resumo Entrada Estoque</th>
                                    <th className="p-2 text-center">Status</th>
                                    <th className="p-2 text-left">Vínculo no Sistema</th>
                                    <th className="p-2 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nfeData.items.map((item, index) => {
                                    const stockEntryQty = item.quantity * item.conversionFactor;
                                    const newCostPrice = item.unitPrice / item.conversionFactor;
                                    const targetUnit = item.linkedProductDetails?.isBulk ? 'kg' : 'un';

                                    return (
                                    <tr key={index} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                                        <td className="p-2 text-center">
                                            {item.status === 'UNLINKED' && (
                                                <input type="checkbox" checked={selectedItems.has(index)} onChange={() => handleSelectionChange(index)} className="cursor-pointer"/>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <p className="font-semibold text-xs uppercase">{item.name}</p>
                                            <p className="text-[10px] text-gray-500">
                                                NF: {item.quantity} un x {formatCurrency(item.unitPrice)}
                                            </p>
                                        </td>
                                         <td className="p-2 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={item.conversionFactor}
                                                    onChange={(e) => handleConversionFactorChange(index, e.target.value)}
                                                    className="w-20 text-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md py-1 font-bold text-theme-primary"
                                                    min="0.001"
                                                    disabled={item.status === 'UNLINKED'}
                                                />
                                                <span className="text-[9px] text-gray-400 uppercase">Qtd x Fator</span>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="flex items-center gap-2">
                                                <ArrowRight size={14} className="text-gray-400"/>
                                                <div>
                                                    <p className="font-bold text-theme-primary">{stockEntryQty.toFixed(3)} {targetUnit}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        Custo Unit: {formatCurrency(newCostPrice)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-2 text-center"><StatusBadge status={item.status} /></td>
                                        <td className="p-2">
                                            {item.status === 'LINKED' && item.linkedProductDetails && (
                                                <div>
                                                     <p className="font-semibold text-xs">{item.linkedProductDetails.name}</p>
                                                     <p className="text-[10px] text-gray-400 italic">Preço Venda: {formatCurrency(item.linkedProductDetails.price)}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex justify-center gap-1">
                                                {item.status === 'UNLINKED' && (
                                                    <>
                                                        <Button size="sm" variant="secondary" onClick={() => handleItemStatusChange(index, 'NEW')} className="!p-1.5" title="Marcar como Novo"><PlusCircle size={14}/></Button>
                                                        <Button size="sm" variant="secondary" onClick={() => handleOpenLinkModal(item, index)} className="!p-1.5" title="Vincular a Produto"><Link size={14}/></Button>
                                                    </>
                                                )}
                                                {(item.status === 'LINKED' || item.status === 'NEW') && (
                                                     <Button size="sm" variant="secondary" onClick={() => handleItemStatusChange(index, 'UNLINKED')} className="!p-1.5" title="Alterar Vínculo"><Pencil size={14}/></Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/30">
                        <div className="text-sm text-gray-500">
                            Certifique-se de que todos os itens estão <strong>Vinculados</strong> ou como <strong>Novo Produto</strong>.
                        </div>
                        <Button onClick={handleConfirmImport} variant="success" size="lg" disabled={isLoading || unlinkedCount > 0}>
                            {isLoading ? 'Processando...' : 'Finalizar e Atualizar Estoque'}
                        </Button>
                    </div>
                </div>
            )}
            
            <ProductLinkModal
                isOpen={linkingItem !== null}
                onClose={() => setLinkingItem(null)}
                onLinkProduct={handleProductLink}
                nfeItem={linkingItem?.item}
            />
        </div>
    );
};

export default NFeImport;
