
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Category } from '../../types';
import Button from '../shared/Button';
import { Plus, Edit, Trash2, Search, Tag, AlertTriangle } from 'lucide-react';

interface CategoryManagementProps {
    onNewCategory: () => void;
    onEditCategory: (id: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onNewCategory, onEditCategory }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const allCategories = await db.getAll('categories');
            setCategories(allCategories.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
        } finally {
            setLoading(false);
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (deleteConfirmId === id) {
            try {
                await db.delete('categories', id);
                setDeleteConfirmId(null);
                fetchCategories();
            } catch (error) {
                console.error("Erro ao excluir categoria:", error);
            }
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const filteredCategories = categories.filter(c => 
        (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome da categoria..."
                        className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={onNewCategory}>
                    <Plus size={20} className="mr-2" /> Nova Categoria
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-gray-700">
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {filteredCategories.map(category => (
                                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                                                <Tag size={20} />
                                            </div>
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{category.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-mono text-gray-500">{category.id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => onEditCategory(category.id)}>
                                                <Edit size={18} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDelete(category.id)} 
                                                className={`transition-all ${deleteConfirmId === category.id ? 'text-white bg-red-500 hover:bg-red-600 rounded-lg px-2 w-auto' : 'text-red-500 hover:text-red-600'}`}
                                                title={deleteConfirmId === category.id ? 'Clique novamente para confirmar' : 'Excluir categoria'}
                                            >
                                                <Trash2 size={18} />
                                                {deleteConfirmId === category.id && <span className="text-[10px] font-black ml-1 uppercase">Confirmar?</span>}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCategories.length === 0 && !loading && (
                    <div className="p-12 text-center">
                        <Tag size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold uppercase text-sm">Nenhuma categoria encontrada</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManagement;
