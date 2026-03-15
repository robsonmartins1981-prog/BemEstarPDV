
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Customer } from '../../types';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { Search, UserPlus, UserCircle, Phone, MapPin } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSelectCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const allCustomers = await db.getAll('customers');
      setCustomers(allCustomers.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.cpf || '').includes(searchTerm) ||
    (c.phone || '').includes(searchTerm)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Selecionar Cliente" size="lg">
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:border-theme-primary transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? (
            <p className="text-center py-8 text-gray-400 font-bold uppercase text-xs animate-pulse">Carregando Clientes...</p>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <UserCircle size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase text-xs">Nenhum cliente encontrado</p>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-theme-primary/5 border border-gray-100 dark:border-gray-700 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl group-hover:bg-theme-primary group-hover:text-white transition-all">
                    <UserCircle size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-white">{customer.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{customer.cpf}</p>
                      {customer.phone && (
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                          <Phone size={10} /> {customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  {customer.address && (
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 justify-end">
                      <MapPin size={10} /> {customer.address.split(',')[0]}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="pt-4 border-t dark:border-gray-700">
          <Button variant="secondary" className="w-full py-4 rounded-2xl">
            <UserPlus size={20} className="mr-2" /> Cadastrar Novo Cliente
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerModal;
