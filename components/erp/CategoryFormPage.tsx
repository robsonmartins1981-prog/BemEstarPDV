import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Category } from '../../types';
import Button from '../shared/Button';
import { Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CategoryFormPageProps {
  categoryId?: string;
  onBack: () => void;
}

const CategoryFormPage: React.FC<CategoryFormPageProps> = ({ categoryId, onBack }) => {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (categoryId) {
                const category = await db.get('categories', categoryId);
                if (category) {
                    setName(category.name);
                } else {
                    console.error("Category not found");
                    onBack();
                }
            }
            setIsLoading(false);
        };
        fetchData();
    }, [categoryId, onBack]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('O nome da categoria é obrigatório.');
            return;
        }
        
        const categoryData: Category = {
            id: categoryId || uuidv4(),
            name: name.trim()
        };

        try {
            await db.put('categories', categoryData);
            onBack();
        } catch (error) {
            console.error("Erro ao salvar categoria:", error);
            alert("Erro ao salvar. Verifique se já não existe uma categoria com este nome.");
        }
    };
    
    if (isLoading) {
        return <div className="text-center p-8">Carregando dados da categoria...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-lg mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="category-name" className="block text-sm font-medium">Nome da Categoria</label>
                    <input
                        id="category-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-theme-primary focus:ring-theme-primary dark:border-gray-600 dark:bg-gray-700"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary"><Save size={16} className="mr-2"/>Salvar Categoria</Button>
                </div>
            </form>
        </div>
    );
};

export default CategoryFormPage;
