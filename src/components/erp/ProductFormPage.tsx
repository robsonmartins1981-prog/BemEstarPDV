
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category, Supplier, InventoryLot } from '../../types';
import Button from '../shared/Button';
import ProductSearchModal from '../shared/ProductSearchModal';
import { ImageOff, ReceiptText, Save, History, TrendingUp, TrendingDown, Minus, Upload, X, ImageIcon, Calendar, Boxes, Tag, Hash, Barcode, PackagePlus, Plus, Trash2, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, formatDecimal, parseCurrencyInput } from '../../utils/formatUtils';
import { safeLocaleDateString, safeLocaleTimeString } from '../../utils/dateUtils';

interface ProductFormPageProps {
  productId?: string;
  categories: Category[];
  onBack: () => void;
}

const ProductFormPage: React.FC<ProductFormPageProps> = ({ productId, categories, onBack }) => {
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('main');
    
    const [kitItemInput, setKitItemInput] = useState({ productId: '', quantity: 1 });
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    
    const [initialLot, setInitialLot] = useState({
        number: 'LOTE-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000),
        expirationDate: '',
        initialStock: 0,
        costPrice: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [allSuppliers, products] = await Promise.all([
                db.getAll('suppliers'),
                db.getAll('products')
            ]);
            setSuppliers(allSuppliers.sort((a,b) => a.name.localeCompare(b.name)));
            setAllProducts(products.sort((a,b) => a.name.localeCompare(b.name)));

            if (productId) {
                const product = await db.get('products', productId);
                if (product) {
                    setFormData(product);
                } else {
                    onBack();
                }
            } else {
                setFormData({
                    id: '', // Será preenchido manualmente ou via lógica
                    barcode: '',
                    sku: '',
                    name: '',
                    brand: '',
                    price: 0,
                    costPrice: 0,
                    stock: 0,
                    minStock: 0,
                    unitType: 'UN',
                    isBulk: false,
                    scaleCode: '',
                    ncm: '',
                    cfop: '5102',
                    origin: '0',
                    csosn_cst: '102',
                    image: '',
                    categoryId: '',
                    supplierId: '',
                    isKit: false,
                    kitItems: [],
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [productId, onBack]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'price' || name === 'costPrice') {
            const numericValue = parseCurrencyInput(value);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else if (name === 'unitType') {
            setFormData(prev => ({ 
                ...prev, 
                unitType: value as any,
                isBulk: value === 'KG'
            }));
        } else {
             setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
        }
    };

    const handleInitialLotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'costPrice') {
            const numericValue = parseCurrencyInput(value);
            setInitialLot(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setInitialLot(prev => ({ ...prev, [name]: name === 'initialStock' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação de Código Interno OBRIGATÓRIO
        if (!formData.id?.trim()) {
            alert('O Código Interno do produto é obrigatório.');
            return;
        }

        if (!formData.name || formData.price === undefined || formData.price < 0) {
            alert('Preencha os campos obrigatórios.');
            return;
        }

        // Se for novo produto, verifica se o código interno já existe
        if (!productId) {
            const existing = await db.get('products', formData.id);
            if (existing) {
                alert(`Erro: Já existe um produto cadastrado com o código interno "${formData.id}".`);
                return;
            }
        }

        const tx = db.transaction(['products', 'inventoryLots'], 'readwrite');
        const productStore = tx.objectStore('products');
        const lotStore = tx.objectStore('inventoryLots');

        const finalProduct = { ...formData } as Product;
        
        // Registrar histórico de preços se houver alteração
        const now = new Date();
        if (productId) {
            const oldProduct = await db.get('products', productId);
            if (oldProduct) {
                if (oldProduct.price !== finalProduct.price) {
                    finalProduct.salePriceHistory = [
                        ...(oldProduct.salePriceHistory || []),
                        { date: now, price: finalProduct.price }
                    ];
                } else {
                    finalProduct.salePriceHistory = oldProduct.salePriceHistory;
                }

                if (oldProduct.costPrice !== finalProduct.costPrice) {
                    finalProduct.purchasePriceHistory = [
                        ...(oldProduct.purchasePriceHistory || []),
                        { date: now, price: finalProduct.costPrice }
                    ];
                } else {
                    finalProduct.purchasePriceHistory = oldProduct.purchasePriceHistory;
                }
            }
        } else {
            // Novo produto
            finalProduct.salePriceHistory = [{ date: now, price: finalProduct.price }];
            finalProduct.purchasePriceHistory = [{ date: now, price: finalProduct.costPrice }];
            finalProduct.stock = initialLot.initialStock;
        }

        await productStore.put(finalProduct);

        if (!productId && initialLot.initialStock > 0) {
            await lotStore.put({
                id: uuidv4(),
                productId: finalProduct.id,
                supplierId: finalProduct.supplierId,
                quantity: initialLot.initialStock,
                entryDate: new Date(),
                expirationDate: initialLot.expirationDate ? new Date(initialLot.expirationDate + 'T12:00:00') : undefined,
                costPrice: initialLot.costPrice || finalProduct.costPrice || 0,
            });
        }

        await tx.done;
        onBack();
    };

    const handleAddKitItem = () => {
        if (!kitItemInput.productId || kitItemInput.quantity <= 0) return;
        
        setFormData(prev => {
            const currentItems = prev.kitItems || [];
            const existingIndex = currentItems.findIndex(i => i.productId === kitItemInput.productId);
            
            let newItems;
            if (existingIndex >= 0) {
                newItems = [...currentItems];
                newItems[existingIndex].quantity += kitItemInput.quantity;
            } else {
                newItems = [...currentItems, { ...kitItemInput }];
            }
            return { ...prev, kitItems: newItems };
        });
        setKitItemInput({ productId: '', quantity: 1 });
    };

    const handleSelectProductForKit = (product: Product | null) => {
        if (product) {
            setKitItemInput(prev => ({ ...prev, productId: product.id }));
        }
    };

    const handleRemoveKitItem = (productIdToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            kitItems: (prev.kitItems || []).filter(i => i.productId !== productIdToRemove)
        }));
    };

    const calculateSuggestedKitPrice = () => {
        if (!formData.kitItems || formData.kitItems.length === 0) return 0;
        return formData.kitItems.reduce((total, item) => {
            const product = allProducts.find(p => p.id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    };

    const applySuggestedPrice = () => {
        setFormData(prev => ({ ...prev, price: calculateSuggestedKitPrice() }));
    };

    if (isLoading) return <div className="text-center p-8 text-gray-500 font-bold uppercase text-xs animate-pulse">Acessando Arquivos...</div>;
    
    const inputStyle = "mt-1 block w-full rounded-2xl border border-gray-300 py-3 px-4 shadow-sm focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 dark:border-gray-600 dark:bg-gray-700 transition-all outline-none";
    
    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 mb-8">
                <nav className="-mb-px flex space-x-8 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('main')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'main' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>1. Ficha Técnica</button>
                    <button onClick={() => setActiveTab('kit')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'kit' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>Kit / Cesta</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'history' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>Histórico de Preços</button>
                    {!productId && <button onClick={() => setActiveTab('inventory')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'inventory' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>Lote de Entrada</button>}
                    <button onClick={() => setActiveTab('tax')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'tax' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>Dados Fiscais</button>
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'main' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            {/* LINHA DE CÓDIGOS */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 flex items-center gap-1"><Hash size={12}/> Código Interno (ID)</label>
                                    <input 
                                        type="text" 
                                        name="id" 
                                        value={formData.id} 
                                        onChange={handleChange} 
                                        disabled={!!productId}
                                        required 
                                        className={inputStyle + (!!productId ? " opacity-50 cursor-not-allowed bg-gray-100" : "")} 
                                        placeholder="Ex: 1001"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 flex items-center gap-1"><Barcode size={12}/> EAN / Barras</label>
                                    <input 
                                        type="text" 
                                        name="barcode" 
                                        value={formData.barcode || ''} 
                                        onChange={handleChange} 
                                        className={inputStyle} 
                                        placeholder="789..."/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 flex items-center gap-1"><PackagePlus size={12}/> SKU / Ref.</label>
                                    <input 
                                        type="text" 
                                        name="sku" 
                                        value={formData.sku || ''} 
                                        onChange={handleChange} 
                                        className={inputStyle} 
                                        placeholder="REF-001"/>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome do Produto</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} placeholder="Ex: Nozes Chilenas Quartos"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 flex items-center gap-1"><Tag size={12}/> Marca / Fornecedor Referência</label>
                                <input type="text" name="brand" value={formData.brand || ''} onChange={handleChange} placeholder="Ex: Importação Própria, Nestlé..." className={inputStyle}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Preço Venda (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                        <input 
                                            type="text" 
                                            name="price" 
                                            value={formatDecimal(formData.price)} 
                                            onChange={handleChange} 
                                            required 
                                            className={inputStyle + " pl-10 font-mono text-theme-primary font-black text-xl"}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Custo Médio (R$)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                        <input 
                                            type="text" 
                                            name="costPrice" 
                                            value={formatDecimal(formData.costPrice)} 
                                            onChange={handleChange} 
                                            className={inputStyle + " pl-10 font-mono"}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Categoria de Inventário</label>
                                    <select name="categoryId" value={formData.categoryId || ''} onChange={handleChange} className={inputStyle}>
                                        <option value="">Selecione...</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Tipo de Venda</label>
                                    <select name="unitType" value={formData.unitType || 'UN'} onChange={handleChange} className={inputStyle}>
                                        <option value="UN">Unidade (UN)</option>
                                        <option value="KG">Quilograma (KG)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                             {formData.image ? <img src={formData.image} className="h-48 w-48 object-contain rounded-2xl mb-4 shadow-sm"/> : <ImageIcon size={64} className="text-gray-300 mb-4"/>}
                             <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Imagem Ilustrativa</p>
                        </div>
                    </div>
                )}

                {activeTab === 'kit' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <input 
                                type="checkbox" 
                                id="isKit" 
                                name="isKit" 
                                checked={formData.isKit || false} 
                                onChange={handleChange} 
                                className="w-5 h-5 rounded border-gray-300 text-theme-primary focus:ring-theme-primary"
                            />
                            <label htmlFor="isKit" className="text-sm font-bold text-gray-700 dark:text-gray-300">Este produto é um Kit / Cesta (Composto por outros produtos)</label>
                        </div>

                        {formData.isKit && (
                            <div className="space-y-4">
                                <div className="p-4 bg-theme-primary/10 border-l-4 border-theme-primary text-theme-primary rounded-r-xl flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-tight flex items-center gap-2">
                                            <PackagePlus size={16}/> Composição do Kit
                                        </p>
                                        <p className="text-[10px] font-medium mt-1">Adicione os produtos que compõem este kit. O estoque do kit será baixado com base nos itens.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-gray-500">Preço Sugerido (Soma)</p>
                                        <p className="text-lg font-black text-theme-primary">{formatCurrency(calculateSuggestedKitPrice())}</p>
                                        <button type="button" onClick={applySuggestedPrice} className="text-[10px] font-bold text-theme-primary hover:underline">Aplicar ao Preço de Venda</button>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-end bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Produto</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <input 
                                                    type="text"
                                                    readOnly
                                                    placeholder="Clique para pesquisar..."
                                                    value={allProducts.find(p => p.id === kitItemInput.productId)?.name || ''}
                                                    onClick={() => setIsSearchModalOpen(true)}
                                                    className={inputStyle + " cursor-pointer pr-10"}
                                                />
                                                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                            <Button type="button" variant="secondary" onClick={() => setIsSearchModalOpen(true)} className="rounded-xl px-4">
                                                <Search size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Qtd.</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={kitItemInput.quantity} 
                                            onChange={(e) => setKitItemInput(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                            className={inputStyle}
                                        />
                                    </div>
                                    <Button type="button" onClick={handleAddKitItem} variant="primary" className="mb-1 h-[46px] rounded-xl px-6">
                                        <Plus size={18} />
                                    </Button>
                                </div>

                                {formData.kitItems && formData.kitItems.length > 0 && (
                                    <div className="border dark:border-gray-700 rounded-2xl overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-black">
                                                <tr>
                                                    <th className="px-4 py-3">Produto</th>
                                                    <th className="px-4 py-3 text-center">Qtd.</th>
                                                    <th className="px-4 py-3 text-right">Preço Unit.</th>
                                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                                    <th className="px-4 py-3 text-center">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y dark:divide-gray-700">
                                                {formData.kitItems.map((item, index) => {
                                                    const product = allProducts.find(p => p.id === item.productId);
                                                    const subtotal = product ? product.price * item.quantity : 0;
                                                    return (
                                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <td className="px-4 py-3 font-medium">{product?.name || 'Produto não encontrado'}</td>
                                                            <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-gray-500">{formatCurrency(product?.price)}</td>
                                                            <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(subtotal)}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <button type="button" onClick={() => handleRemoveKitItem(item.productId)} className="text-red-500 hover:text-red-700 p-1">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Histórico de Venda */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={16} className="text-green-500" /> Evolução do Preço de Venda
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-400">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Data da Alteração</th>
                                                <th className="px-4 py-2 text-right">Valor (R$)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {(!formData.salePriceHistory || formData.salePriceHistory.length === 0) ? (
                                                <tr><td colSpan={2} className="px-4 py-4 text-center text-gray-400 italic">Nenhum registro.</td></tr>
                                            ) : (
                                                [...(formData.salePriceHistory || [])].reverse().map((h, i) => (
                                                    <tr key={i} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                            {safeLocaleDateString(h.date)} {safeLocaleTimeString(h.date, { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-theme-primary">{formatCurrency(h.price)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Histórico de Compra */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <TrendingDown size={16} className="text-blue-500" /> Histórico de Preços de Compra
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-400">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Data da Alteração</th>
                                                <th className="px-4 py-2 text-right">Valor (R$)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-700">
                                            {(!formData.purchasePriceHistory || formData.purchasePriceHistory.length === 0) ? (
                                                <tr><td colSpan={2} className="px-4 py-4 text-center text-gray-400 italic">Nenhum registro.</td></tr>
                                            ) : (
                                                [...(formData.purchasePriceHistory || [])].reverse().map((h, i) => (
                                                    <tr key={i} className="hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                            {safeLocaleDateString(h.date)} {safeLocaleTimeString(h.date, { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-gray-700 dark:text-gray-200">{formatCurrency(h.price)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && !productId && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-4 bg-theme-primary/10 border-l-4 border-theme-primary text-theme-primary rounded-r-xl">
                            <p className="text-xs font-bold uppercase tracking-tight flex items-center gap-2">
                                <Boxes size={16}/> Registro de Primeiro Lote
                            </p>
                            <p className="text-[10px] font-medium mt-1">Obrigatorio informar a validade para produtos perecíveis ou naturais.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Referência do Lote</label>
                                <input type="text" name="number" value={initialLot.number} onChange={handleInitialLotChange} className={inputStyle}/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Vencimento do Lote</label>
                                <input type="date" name="expirationDate" value={initialLot.expirationDate} onChange={handleInitialLotChange} className={inputStyle} required/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Qtd em Estoque</label>
                                <input type="number" name="initialStock" value={initialLot.initialStock} onChange={handleInitialLotChange} className={inputStyle} placeholder="0"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Custo de Aquisição (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input 
                                        type="text" 
                                        name="costPrice" 
                                        value={formatCurrency(initialLot.costPrice)} 
                                        onChange={handleInitialLotChange} 
                                        className={inputStyle + " pl-10 font-mono"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tax' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">NCM</label>
                            <input type="text" name="ncm" value={formData.ncm || ''} onChange={handleChange} className={inputStyle} placeholder="0000.00.00"/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">CFOP Saída</label>
                            <input type="text" name="cfop" value={formData.cfop || ''} onChange={handleChange} className={inputStyle}/>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">CSOSN / CST</label>
                            <input type="text" name="csosn_cst" value={formData.csosn_cst || ''} onChange={handleChange} className={inputStyle}/>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" className="px-8 rounded-2xl" onClick={onBack}>Sair sem Salvar</Button>
                    <Button type="submit" variant="primary" className="px-10 rounded-2xl shadow-lg shadow-theme-primary/30">
                        <Save size={18} className="mr-2"/> Confirmar Cadastro
                    </Button>
                </div>
            </form>

            <ProductSearchModal 
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSelect={handleSelectProductForKit}
                title="Selecionar Produto para o Kit"
            />
        </div>
    );
};

export default ProductFormPage;
