
import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { Save, ArrowLeft, Tag, Loader2 } from 'lucide-react';
import { db } from '../../services/databaseService';
import { v4 as uuidv4 } from 'uuid';
import type { Category } from '../../types';

interface CategoryFormPageProps {
  categoryId?: string;
  onBack: () => void;
}

const CategoryFormPage: React.FC<CategoryFormPageProps> = ({ categoryId, onBack }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  const loadCategory = async () => {
    setLoading(true);
    try {
      const category = await db.get('categories', categoryId!);
      if (category) {
        setName(category.name);
      }
    } catch (error) {
      console.error("Erro ao carregar categoria:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const categoryData: Category = {
        id: categoryId || uuidv4(),
        name: name.trim(),
      };

      await db.put('categories', categoryData);
      
      onBack();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">
          {categoryId ? 'Editar Categoria' : 'Nova Categoria'}
        </h1>
      </div>
      
      <form className="space-y-6" onSubmit={handleSave}>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome da Categoria</label>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary" 
              placeholder="Ex: Bebidas, Mercearia, Limpeza..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={onBack} disabled={saving}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving || !name.trim()}>
            {saving ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {saving ? 'Salvando...' : 'Salvar Categoria'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CategoryFormPage;
