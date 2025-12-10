import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Category } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface CategoryManagementProps {
    onNewCategory: () => void;
    onEditCategory: (categoryId: string) => void;
}

// Componente principal para a gestão de categorias.
const CategoryManagement: React.FC<CategoryManagementProps> = ({ onNewCategory, onEditCategory }) => {
    const [categories, setCategories] = useState<Category[]>([]);

    const fetchCategories = useCallback(async () => {
        const allCategories = await db.getAll('categories');
        setCategories(allCategories.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);


    const handleDelete = async (id: string) => {
        // Adicionar verificação se a categoria está em uso
        const productsInCategory = await db.getAllFromIndex('products', 'categoryId', id);
        if (productsInCategory.length > 0) {
            alert(`Não é possível excluir esta categoria pois ela está sendo usada por ${productsInCategory.length} produto(s).`);
            return;
        }
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
            await db.delete('categories', id);
            fetchCategories();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <Button onClick={onNewCategory}><PlusCircle size={18}/> Nova Categoria</Button>
            </div>
            
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Nome da Categoria</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <tr key={category.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                <td className="px-6 py-3 font-medium">{category.name}</td>
                                <td className="px-6 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button variant="secondary" className="p-2 h-auto" onClick={() => onEditCategory(category.id)}><Edit size={16}/></Button>
                                        <Button variant="danger" className="p-2 h-auto" onClick={() => handleDelete(category.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {categories.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        Nenhuma categoria cadastrada.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryManagement;
