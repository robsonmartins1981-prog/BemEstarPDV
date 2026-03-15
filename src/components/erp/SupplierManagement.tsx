
import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, Mail, Phone, User } from 'lucide-react';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { Supplier } from '../../types';

interface SupplierManagementProps {
  onNewSupplier: () => void;
  onEditSupplier: (id: string) => void;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ onNewSupplier, onEditSupplier }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      await db.delete('suppliers', id);
      fetchSuppliers();
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cnpj.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:border-theme-primary"
          />
        </div>
        <Button onClick={onNewSupplier}>
          <Plus size={20} className="mr-2" /> Novo Fornecedor
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        </div>
      ) : filteredSuppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-theme-primary/10 p-3 rounded-2xl">
                  <Truck className="w-6 h-6 text-theme-primary" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEditSupplier(supplier.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-theme-primary transition-colors">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-800 dark:text-white mb-1 uppercase truncate">{supplier.name}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">CNPJ: {supplier.cnpj}</p>

              <div className="space-y-2">
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <User size={14} />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Phone size={14} />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Mail size={14} />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-12 text-center">
          <Truck size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold uppercase text-sm">Nenhum fornecedor encontrado</p>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
