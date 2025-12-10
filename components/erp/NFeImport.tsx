

import React, { useState, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Supplier, InventoryLot, Expense, NFeData, NFeItem, NFeItemStatus } from '../../types';
import Button from '../shared/Button';
import ProductLinkModal from './ProductLinkModal';
import { Upload, Link, PlusCircle, CheckCircle, AlertTriangle, ChevronsRight, X, FileQuestion, BadgeCheck, Pencil } from 'lucide-react';
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
            // Explicitly type the Maps to ensure foundProduct is typed as Product | undefined
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
        setLinkingItem(null); // Close modal
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
            
            // 1. Processar fornecedor (usando o novo índice 'cnpj')
            let supplierId = '';
            const existingSupplier = await suppliersStore.index('cnpj').get(nfeData.supplier.cnpj!);
            if (existingSupplier) {
                supplierId = existingSupplier.id;
            } else {
                supplierId = uuidv4();
                await suppliersStore.add({ id: supplierId, cnpj: nfeData.supplier.cnpj!, name: nfeData.supplier.name! });
            }

            // 2. Processar produtos e lotes
            for (const item of nfeData.items) {
                let productToUpdate: Product | undefined;

                if (item.status === 'NEW') {
                    // CORREÇÃO DO ERRO "Key already exists":
                    // Verifica se o produto já existe antes de tentar adicioná-lo.
                    const existingProduct = await productsStore.get(item.code);
                    if (existingProduct) {
                         productToUpdate = existingProduct;
                    } else {
                        const newProduct: Product = {
                            id: item.code,
                            name: item.name,
                            price: item.unitPrice * 1.5, // Sugestão de preço de venda
                            costPrice: item.unitPrice / item.conversionFactor,
                            isBulk: false,
                            stock: 0, // Será atualizado pelo lote
                            ncm: item.ncm,
                            image: 'https://picsum.photos/seed/newproduct/200'
                        };
                        await productsStore.add(newProduct);
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
                    await productsStore.put(productToUpdate);

                    await lotsStore.add({
                        id: uuidv4(),
                        productId: productToUpdate.id,
                        quantity: convertedQuantity,
                        entryDate: new Date(),
                        expirationDate: new Date(item.expirationDate),
                        costPrice: convertedUnitPrice
                    });
                }
            }
            
            await expensesStore.add({
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
            setError(`Falha na importação: ${(err as Error).message}. Verifique o console para mais detalhes.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const unlinkedCount = useMemo(() => nfeData?.items.filter(i => i.status === 'UNLINKED').length || 0, [nfeData]);

    // Lógica para o "Selecionar Todos"
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
        const newFactor = parseInt(factor, 10);
        newItems[index].conversionFactor = isNaN(newFactor) || newFactor < 1 ? 1 : newFactor;
        setNfeData({ ...nfeData, items: newItems });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-2">Importar Compra (NF-e XML)</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Carregue o arquivo para dar entrada automática nos produtos, atualizar o estoque e lançar a fatura no contas a pagar.</p>
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
                    <div className="p-4 border-b dark:border-gray-700 space-y-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Itens da Nota Fiscal ({nfeData.items.length})</h3>
                             <div className="text-sm">
                                <strong>Fornecedor:</strong> {nfeData.supplier.name} | <strong>Total:</strong> {formatCurrency(nfeData.totalAmount)}
                            </div>
                        </div>
                        {unlinkedCount > 0 && (
                            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/40 rounded-md">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong className="font-semibold">{unlinkedCount} item(ns)</strong> precisam de sua atenção.
                                </p>
                                <Button size="sm" variant="secondary" onClick={handleBatchMarkAsNew} disabled={selectedItems.size === 0}>
                                    <PlusCircle size={16} className="mr-1"/> Marcar Selecionados como Novos
                                </Button>
                            </div>
                        )}
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
                                            title="Selecionar todos os itens não vinculados"
                                            className="cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-2 text-left">Item da NFe</th>
                                    <th className="p-2 text-center w-28">Fator Conv.</th>
                                    <th className="p-2 text-left">Entrada Estoque</th>
                                    <th className="p-2 text-center">Status</th>
                                    <th className="p-2 text-left">Produto no Sistema</th>
                                    <th className="p-2 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nfeData.items.map((item, index) => {
                                    const stockEntry = item.quantity * item.conversionFactor;
                                    const newCostPrice = item.unitPrice / item.conversionFactor;
                                    return (
                                    <tr key={index} className="border-b dark:border-gray-700">
                                        <td className="p-2 text-center">
                                            {item.status === 'UNLINKED' && (
                                                <input type="checkbox" checked={selectedItems.has(index)} onChange={() => handleSelectionChange(index)} className="cursor-pointer"/>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.quantity} un @ {formatCurrency(item.unitPrice)}
                                            </p>
                                        </td>
                                         <td className="p-2 text-center">
                                            <input
                                                type="number"
                                                value={item.conversionFactor}
                                                onChange={(e) => handleConversionFactorChange(index, e.target.value)}
                                                className="w-20 text-center bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md py-1"
                                                min="1"
                                                disabled={item.status === 'UNLINKED'}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <p className="font-semibold">{stockEntry.toFixed(3)} un</p>
                                            <p className="text-xs text-gray-500">
                                                Custo: {formatCurrency(newCostPrice)}/un
                                            </p>
                                        </td>
                                        <td className="p-2 text-center"><StatusBadge status={item.status} /></td>
                                        <td className="p-2">
                                            {item.status === 'LINKED' && item.linkedProductDetails && (
                                                <div>
                                                     <p className="font-semibold">{item.linkedProductDetails.name}</p>
                                                     <p className="text-xs text-gray-500">ID: {item.linkedProductDetails.id}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <div className="flex justify-center gap-1">
                                                {item.status === 'UNLINKED' && (
                                                    <>
                                                        <Button size="sm" variant="secondary" onClick={() => handleItemStatusChange(index, 'NEW')}><PlusCircle size={14} className="mr-1"/>Marcar Novo</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => handleOpenLinkModal(item, index)}><Link size={14} className="mr-1"/>Vincular</Button>
                                                    </>
                                                )}
                                                {(item.status === 'LINKED' || item.status === 'NEW') && (
                                                     <Button size="sm" variant="secondary" onClick={() => handleItemStatusChange(index, 'UNLINKED')}><Pencil size={14} className="mr-1"/>Alterar</Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end p-4">
                        <Button onClick={handleConfirmImport} variant="success" size="lg" disabled={isLoading || unlinkedCount > 0}>
                            {isLoading ? 'Importando...' : 'Confirmar e Dar Entrada no Estoque'}
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
