
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';

interface ProductManagementProps {
    onNewProduct: () => void;
    onEditProduct: (productId: string) => void;
}

// Componente principal para a gestão de produtos.
const ProductManagement: React.FC<ProductManagementProps> = ({ onNewProduct, onEditProduct }) => {
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
            // Lógica adicional para remover lotes seria necessária aqui em um cenário real.
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
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Gerenciamento de Produtos</h2>
                <Button onClick={onNewProduct}><PlusCircle size={18}/> Novo Produto</Button>
            </div>
            
            {/* Tabela de Produtos */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Produto</th>
                            <th className="px-6 py-3">Categoria</th>
                            <th className="px-6 py-3">Cód. Barras</th>
                            <th className="px-6 py-3 text-right">Preço Venda</th>
                            <th className="px-6 py-3 text-right">Estoque</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                        {/* Linha de Filtros */}
                         <tr className="bg-gray-100 dark:bg-gray-900/50">
                            <th className="px-4 py-2 font-normal">
                                <input type="text" name="name" placeholder="Filtrar nome..." value={filters.name} onChange={handleFilterChange} className={filterInputClass} />
                            </th>
                            <th className="px-4 py-2 font-normal">
                                 <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} className={filterInputClass}>
                                    <option value="">Todas</option>
                                    {categories.map(cat => ( <option key={cat.id} value={cat.id}>{cat.name}</option> ))}
                                </select>
                            </th>
                             <th className="px-4 py-2 font-normal">
                                <input type="text" name="id" placeholder="Filtrar código..." value={filters.id} onChange={handleFilterChange} className={filterInputClass} />
                            </th>
                             <th className="px-4 py-2 font-normal">
                                <input type="text" name="price" placeholder="Filtrar preço..." value={filters.price} onChange={handleFilterChange} className={`${filterInputClass} text-right`} />
                            </th>
                             <th className="px-4 py-2 font-normal">
                                <input type="text" name="stock" placeholder="Filtrar estoque..." value={filters.stock} onChange={handleFilterChange} className={`${filterInputClass} text-right`} />
                            </th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                <td className="px-6 py-3 font-medium">{product.name}</td>
                                <td className="px-6 py-3">{categoryMap.get(product.categoryId || '') || '-'}</td>
                                <td className="px-6 py-3 font-mono">{product.id}</td>
                                <td className="px-6 py-3 text-right font-mono">{formatCurrency(product.price)}</td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="font-mono">{product.stock} {product.isBulk ? 'kg' : 'un'}</span>
                                        {product.minStock && product.minStock > 0 && (
                                            <span className="text-xs text-gray-500">(Mín: {product.minStock})</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button variant="secondary" className="p-2 h-auto" onClick={() => onEditProduct(product.id)}><Edit size={16}/></Button>
                                        <Button variant="danger" className="p-2 h-auto" onClick={() => handleDelete(product.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProducts.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        Nenhum produto encontrado com os filtros aplicados.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
