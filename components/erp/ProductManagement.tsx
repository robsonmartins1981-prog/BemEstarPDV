
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, FileCode } from 'lucide-react';

interface ProductManagementProps {
    onNewProduct: () => void;
    onEditProduct: (productId: string) => void;
    onImportXML: () => void; // Nova prop para navegar para importação
}

// Componente principal para a gestão de produtos.
const ProductManagement: React.FC<ProductManagementProps> = ({ onNewProduct, onEditProduct, onImportXML }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [filters, setFilters] = useState({
        name: '',
        categoryId: '',
        id: '',
        price: '',
        stock: '',
    });

    const fetchData = useCallback(async () => {
        const [allProducts, allCategories] = await Promise.all([
            db.getAll('products'),
            db.getAll('categories'),
        ]);
        setProducts(allProducts);
        setCategories(allCategories.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este produto? Isso também removerá os lotes associados.')) {
            await db.delete('products', id);
            fetchData();
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const priceString = p.price.toLocaleString('pt-BR');
            return (
                p.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                p.id.toLowerCase().includes(filters.id.toLowerCase()) &&
                (priceString.includes(filters.price.toLowerCase()) || p.price.toString().includes(filters.price.toLowerCase())) &&
                p.stock.toString().toLowerCase().includes(filters.stock.toLowerCase()) &&
                (filters.categoryId === '' || p.categoryId === filters.categoryId)
            );
        });
    }, [products, filters]);


    const formatCurrency = (value?: number) => value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A';
    
    const filterInputClass = "w-full px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-theme-primary focus:border-theme-primary";


    return (
        <div className="space-y-4">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Produtos</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary" onClick={onImportXML} className="flex-1 md:flex-none">
                        <FileCode size={18}/> Importar XML
                    </Button>
                    <Button onClick={onNewProduct} className="flex-1 md:flex-none">
                        <PlusCircle size={18}/> Novo Produto
                    </Button>
                </div>
            </div>
            
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm text-left">
                     <thead className="text-[10px] text-gray-500 uppercase font-black bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-4">Produto</th>
                            <th className="px-6 py-4">Categoria</th>
                            <th className="px-6 py-4">Cód. Barras</th>
                            <th className="px-6 py-4 text-right">Preço Venda</th>
                            <th className="px-6 py-4 text-right">Estoque</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                        <tr className="bg-white dark:bg-gray-800">
                            <th className="px-4 py-2 font-normal">
                                <input type="text" name="name" placeholder="Filtrar..." value={filters.name} onChange={handleFilterChange} className={filterInputClass} />
                            </th>
                            <th className="px-4 py-2 font-normal">
                                 <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} className={filterInputClass}>
                                    <option value="">Todas</option>
                                    {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
                                </select>
                            </th>
                             <th className="px-4 py-2 font-normal">
                                <input type="text" name="id" placeholder="Cód..." value={filters.id} onChange={handleFilterChange} className={filterInputClass} />
                            </th>
                             <th className="px-4 py-2 font-normal"></th>
                             <th className="px-4 py-2 font-normal"></th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-600/10 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{product.name}</td>
                                <td className="px-6 py-4 text-gray-500">{categoryMap.get(product.categoryId || '') || '-'}</td>
                                <td className="px-6 py-4 font-mono text-xs text-gray-400">{product.id}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-theme-primary">{formatCurrency(product.price)}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={`font-mono font-bold ${product.stock <= (product.minStock || 0) ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {product.stock.toFixed(2)} {product.isBulk ? 'kg' : 'un'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button variant="secondary" className="!p-2 h-auto" onClick={() => onEditProduct(product.id)}><Edit size={16}/></Button>
                                        <Button variant="danger" className="!p-2 h-auto" onClick={() => handleDelete(product.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProducts.length === 0 && (
                    <div className="text-center p-12 text-gray-400 uppercase text-xs font-bold tracking-widest">
                        Nenhum produto encontrado.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
