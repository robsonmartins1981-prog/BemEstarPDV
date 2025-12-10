
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category, Supplier } from '../../types';
import Button from '../shared/Button';
import { ImageOff, ReceiptText, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ProductFormPageProps {
  productId?: string;
  categories: Category[];
  onBack: () => void;
}

// Componente de página inteira para o formulário de produto (usado para criar e editar).
const ProductFormPage: React.FC<ProductFormPageProps> = ({ productId, categories, onBack }) => {
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [activeTab, setActiveTab] = useState('main');

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
                    console.error("Product not found");
                    onBack(); // Volta se o produto não for encontrado
                }
            } else {
                // Padrões para um novo produto
                setFormData({
                    id: uuidv4(),
                    name: '',
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


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
             setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validação simples
        if (!formData.name || !formData.id || formData.price === undefined || formData.price < 0) {
            alert('Preencha os campos obrigatórios: ID, Nome e Preço de Venda.');
            return;
        }
        if (formData.isBulk && (!formData.scaleCode || formData.scaleCode.length !== 6)) {
            alert('Produtos a granel devem ter um "Código da Balança" de 6 dígitos.');
            return;
        }

        await db.put('products', formData as Product);
        onBack(); // Volta para a lista após salvar
    };
    
    if (isLoading) {
        return <div className="text-center p-8">Carregando dados do produto...</div>;
    }
    
    const inputStyleClasses = "mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-theme-primary focus:ring-theme-primary dark:border-gray-600 dark:bg-gray-700";
    
    const TabButton: React.FC<{ tabId: string; children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${activeTab === tabId ? 'border-theme-primary text-theme-primary' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
        >
            {children}
        </button>
    );

    return (
         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <TabButton tabId="main">Dados Principais</TabButton>
                        <TabButton tabId="tax">Tributação</TabButton>
                    </nav>
                </div>

                {/* Aba de Dados Principais */}
                <div className={activeTab === 'main' ? 'block' : 'hidden'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div>
                            <label className="block text-sm font-medium">Nome do Produto</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyleClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Código de Barras (ID)</label>
                            <input type="text" name="id" value={formData.id} required className={`${inputStyleClasses} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} readOnly/>
                            <p className="text-xs text-gray-500 mt-1">O ID é gerado automaticamente para novos produtos.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Preço de Venda (R$)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" className={inputStyleClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Preço de Custo (R$)</label>
                            <input type="number" name="costPrice" value={formData.costPrice || ''} onChange={handleChange} min="0" step="0.01" className={inputStyleClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Categoria</label>
                            <select name="categoryId" value={formData.categoryId || ''} onChange={handleChange} className={inputStyleClasses}>
                                <option value="">Nenhuma categoria</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fornecedor Padrão</label>
                            <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className={inputStyleClasses}>
                                <option value="">Nenhum / Vários</option>
                                {suppliers.map(sup => (
                                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Estoque Atual</label>
                            <input type="number" name="stock" value={formData.stock} readOnly className={`${inputStyleClasses} bg-gray-100 dark:bg-gray-800`}/>
                            <p className="text-xs text-gray-500 mt-1">O estoque é calculado por lotes. Use "Inventário" para ajustes.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Estoque Mínimo</label>
                            <input type="number" name="minStock" value={formData.minStock || ''} onChange={handleChange} min="0" className={inputStyleClasses}/>
                            <p className="text-xs text-gray-500 mt-1">Quantidade gatilho para recompra.</p>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="isBulk" name="isBulk" checked={formData.isBulk} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-theme-primary focus:ring-theme-primary"/>
                            <label htmlFor="isBulk" className="ml-2 block text-sm">Vendido a Granel (por kg)</label>
                        </div>
                        {formData.isBulk && (
                            <div>
                                <label className="block text-sm font-medium">Código da Balança (6 dígitos)</label>
                                <input type="text" name="scaleCode" value={formData.scaleCode || ''} onChange={handleChange} maxLength={6} className={inputStyleClasses}/>
                                <p className="text-xs text-gray-500 mt-1">Código para a balança.</p>
                            </div>
                        )}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">URL da Imagem do Produto</label>
                            <div className="flex items-center gap-4 mt-1">
                                <input type="text" name="image" value={formData.image || ''} onChange={e => { handleChange(e); setImageError(false); }} placeholder="https://exemplo.com/imagem.jpg" className={inputStyleClasses + " flex-grow"}/>
                                {formData.image && !imageError ? ( <img src={formData.image} alt="Preview" className="w-16 h-16 rounded-md object-cover border dark:border-gray-600" onError={() => setImageError(true)}/> ) : ( <div className="w-16 h-16 rounded-md border dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><ImageOff className="text-gray-400" /></div> )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Aba de Tributação */}
                <div className={activeTab === 'tax' ? 'block space-y-4 pt-4' : 'hidden'}>
                     <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-r-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <ReceiptText className="inline-block w-5 h-5 mr-2" />
                            Configure a tributação padrão. Estes valores serão usados na emissão da NFC-e.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div>
                            <label className="block text-sm font-medium">NCM</label>
                            <input type="text" name="ncm" value={formData.ncm || ''} onChange={handleChange} placeholder="Ex: 08023100" className={inputStyleClasses}/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">CFOP</label>
                            <input type="text" name="cfop" value={formData.cfop || ''} onChange={handleChange} placeholder="Ex: 5102" className={inputStyleClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Origem da Mercadoria</label>
                            <select name="origin" value={formData.origin || ''} onChange={handleChange} className={inputStyleClasses}>
                                <option value="0">0 - Nacional</option>
                                <option value="1">1 - Estrangeira (Importação Direta)</option>
                                <option value="2">2 - Estrangeira (Adquirida no Mercado Interno)</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium">CSOSN / CST</label>
                            <input type="text" name="csosn_cst" value={formData.csosn_cst || ''} onChange={handleChange} placeholder="Ex: 102" className={inputStyleClasses}/>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary"><Save size={16} className="mr-2"/>Salvar Produto</Button>
                </div>
            </form>
        </div>
    );
};

export default ProductFormPage;
