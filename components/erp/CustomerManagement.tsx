import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Customer } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';

interface CustomerManagementProps {
    onNewCustomer: () => void;
    onEditCustomer: (customerId: string) => void;
}

// Componente principal para a gestão de clientes.
const CustomerManagement: React.FC<CustomerManagementProps> = ({ onNewCustomer, onEditCustomer }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCustomers = useCallback(async () => {
        const allCustomers = await db.getAll('customers');
        setCustomers(allCustomers);
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            await db.delete('customers', id);
            fetchCustomers();
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf.includes(searchTerm)
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CPF..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <Button onClick={onNewCustomer}><PlusCircle size={18}/> Novo Cliente</Button>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">CPF</th>
                            <th className="px-6 py-3">Telefone</th>
                            <th className="px-6 py-3">E-mail</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                <td className="px-6 py-3 font-medium">{customer.name}</td>
                                <td className="px-6 py-3">{customer.cpf}</td>
                                <td className="px-6 py-3">{customer.phone}</td>
                                <td className="px-6 py-3">{customer.email}</td>
                                <td className="px-6 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button variant="secondary" className="p-2 h-auto" onClick={() => onEditCustomer(customer.id)}><Edit size={16}/></Button>
                                        <Button variant="danger" className="p-2 h-auto" onClick={() => handleDelete(customer.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CustomerManagement;
