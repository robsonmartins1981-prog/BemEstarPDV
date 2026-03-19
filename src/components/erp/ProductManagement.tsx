
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Product } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import Button from '../shared/Button';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import ProductImportModal from './ProductImportModal';

interface ProductManagementProps {
    onNewProduct: () => void;
    onEditProduct: (id: string) => void;
    onImportXML: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onNewProduct, onEditProduct, onImportXML }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const allProducts = await db.getAll('products');
            setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setLoading(false);
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (deleteConfirmId === id) {
            try {
                await db.delete('products', id);
                setDeleteConfirmId(null);
                fetchProducts();
            } catch (error) {
                console.error("Erro ao excluir produto:", error);
            }
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const filteredProducts = products.filter(p => 
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode || '').includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, SKU ou código de barras..."
                        className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary" onClick={() => setIsImportModalOpen(true)}>
                        <FileSpreadsheet size={20} className="mr-2" /> Importar Planilha
                    </Button>
                    <Button variant="secondary" onClick={onImportXML}>Importar XML</Button>
                    <Button onClick={onNewProduct}>
                        <Plus size={20} className="mr-2" /> Novo Produto
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-gray-700">
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">SKU / Cód.</th>
                                <th className="px-6 py-4">Preço</th>
                                <th className="px-6 py-4">Estoque</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{product.name}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-black">{product.categoryId || 'Sem Categoria'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-mono text-gray-500">{product.sku || '-'}</p>
                                        <p className="text-[10px] text-gray-400">{product.barcode || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-sm text-theme-primary">
                                            {formatCurrency(product.price)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-sm ${product.stock <= (product.minStock || 0) ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                                {product.stock} {product.unitType?.toLowerCase() || 'un'}
                                            </span>
                                            {product.stock <= (product.minStock || 0) && <AlertTriangle size={14} className="text-red-500" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => onEditProduct(product.id)}>
                                                <Edit size={18} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(product.id)} 
                                                className={`transition-all ${deleteConfirmId === product.id ? 'text-white bg-red-500 hover:bg-red-600 rounded-lg px-2 w-auto' : 'text-red-500 hover:text-red-600'}`}
                                                title={deleteConfirmId === product.id ? 'Clique novamente para confirmar' : 'Excluir produto'}
                                            >
                                                <Trash2 size={18} />
                                                {deleteConfirmId === product.id && <span className="text-[10px] font-black ml-1 uppercase">Confirmar?</span>}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredProducts.length === 0 && !loading && (
                    <div className="p-12 text-center">
                        <Package size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold uppercase text-sm">Nenhum produto encontrado</p>
                    </div>
                )}
            </div>

            {isImportModalOpen && (
                <ProductImportModal 
                    onClose={() => setIsImportModalOpen(false)} 
                    onSuccess={fetchProducts} 
                />
            )}
        </div>
    );
};

export default ProductManagement;
