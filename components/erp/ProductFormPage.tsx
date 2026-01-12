
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category, Supplier, InventoryLot } from '../../types';
import Button from '../shared/Button';
import { ImageOff, ReceiptText, Save, History, TrendingUp, TrendingDown, Minus, Upload, X, ImageIcon, Calendar, Boxes, Tag, Hash, Barcode } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ProductFormPageProps {
  productId?: string;
  categories: Category[];
  onBack: () => void;
}

const ProductFormPage: React.FC<ProductFormPageProps> = ({ productId, categories, onBack }) => {
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('main');
    
    const [initialLot, setInitialLot] = useState({
        number: 'LOTE-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000),
        expirationDate: '',
        initialStock: 0,
        costPrice: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const allSuppliers = await db.getAll('suppliers');
            setSuppliers(allSuppliers.sort((a,b) => a.name.localeCompare(b.name)));

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
                    name: '',
                    brand: '',
                    price: 0,
                    costPrice: 0,
                    stock: 0,
                    minStock: 0,
                    isBulk: false,
                    scaleCode: '',
                    ncm: '',
                    cfop: '5102',
                    origin: '0',
                    csosn_cst: '102',
                    image: '',
                    categoryId: '',
                    supplierId: '',
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [productId, onBack]);

    const formatCurrencyDisplay = (val: number | undefined) => {
        if (val === undefined) return '0,00';
        return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const parseCurrencyInput = (value: string): number => {
        const digits = value.replace(/\D/g, '');
        return parseInt(digits || '0', 10) / 100;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'price' || name === 'costPrice') {
            const numericValue = parseCurrencyInput(value);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
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
        if (!productId) {
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

    if (isLoading) return <div className="text-center p-8 text-gray-500 font-bold uppercase text-xs animate-pulse">Acessando Arquivos...</div>;
    
    const inputStyle = "mt-1 block w-full rounded-2xl border border-gray-300 py-3 px-4 shadow-sm focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 dark:border-gray-600 dark:bg-gray-700 transition-all outline-none";
    
    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="border-b border-gray-100 dark:border-gray-700 mb-8">
                <nav className="-mb-px flex space-x-8 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('main')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'main' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>1. Ficha Técnica</button>
                    {!productId && <button onClick={() => setActiveTab('inventory')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'inventory' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>2. Lote de Entrada</button>}
                    <button onClick={() => setActiveTab('tax')} className={`px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'tax' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}>3. Dados Fiscais</button>
                </nav>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'main' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            {/* LINHA DE CÓDIGOS */}
                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 flex items-center gap-1"><Barcode size={12}/> Código de Barras (EAN)</label>
                                    <input 
                                        type="text" 
                                        name="barcode" 
                                        value={formData.barcode || ''} 
                                        onChange={handleChange} 
                                        className={inputStyle} 
                                        placeholder="789..."/>
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
                                            value={formatCurrencyDisplay(formData.price)} 
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
                                            value={formatCurrencyDisplay(formData.costPrice)} 
                                            onChange={handleChange} 
                                            className={inputStyle + " pl-10 font-mono"}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Categoria de Inventário</label>
                                <select name="categoryId" value={formData.categoryId || ''} onChange={handleChange} className={inputStyle}>
                                    <option value="">Selecione...</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                             {formData.image ? <img src={formData.image} className="h-48 w-48 object-contain rounded-2xl mb-4 shadow-sm"/> : <ImageIcon size={64} className="text-gray-300 mb-4"/>}
                             <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Imagem Ilustrativa</p>
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
                                        value={formatCurrencyDisplay(initialLot.costPrice)} 
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
        </div>
    );
};

export default ProductFormPage;
