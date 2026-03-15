
import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { Save, ArrowLeft } from 'lucide-react';
import { db } from '../../services/databaseService';
import type { Supplier } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface SupplierFormPageProps {
  supplierId?: string;
  onBack: () => void;
}

const SupplierFormPage: React.FC<SupplierFormPageProps> = ({ supplierId, onBack }) => {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    cnpj: '',
    contactPerson: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplierId) {
      loadSupplier();
    }
  }, [supplierId]);

  const loadSupplier = async () => {
    const supplier = await db.get('suppliers', supplierId!);
    if (supplier) {
      setFormData(supplier);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supplier: Supplier = {
        id: supplierId || uuidv4(),
        name: formData.name || '',
        cnpj: formData.cnpj || '',
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email
      };

      await db.put('suppliers', supplier);
      onBack();
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">
          {supplierId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Razão Social / Nome Fantasia</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">CNPJ</label>
            <input 
              type="text" 
              required
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Pessoa de Contato</label>
            <input 
              type="text" 
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Telefone</label>
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">E-mail</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            <Save size={18} className="mr-2" /> {loading ? 'Salvando...' : 'Salvar Fornecedor'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SupplierFormPage;
