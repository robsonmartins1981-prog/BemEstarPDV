import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Customer } from '../../types';
import Button from '../shared/Button';
import { Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CustomerFormPageProps {
  customerId?: string;
  onBack: () => void;
}

const CustomerFormPage: React.FC<CustomerFormPageProps> = ({ customerId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            if (customerId) {
                const customer = await db.get('customers', customerId);
                if (customer) {
                    setFormData(customer);
                } else {
                    console.error("Customer not found");
                    onBack();
                }
            } else {
                setFormData({
                    id: uuidv4(),
                    name: '',
                    cpf: '',
                    phone: '',
                    email: '',
                    address: '',
                    creditLimit: 0,
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [customerId, onBack]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.cpf) {
            alert('Nome e CPF são obrigatórios.');
            return;
        }
        await db.put('customers', formData as Customer);
        onBack();
    };

    if (isLoading) {
        return <div className="text-center p-8">Carregando dados do cliente...</div>;
    }

    const inputStyle = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700";

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Nome Completo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">CPF</label>
                        <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} required className={inputStyle} placeholder="000.000.000-00" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Telefone</label>
                        <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">E-mail</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Endereço</label>
                    <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className={inputStyle} />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary"><Save size={16} className="mr-2" /> Salvar Cliente</Button>
                </div>
            </form>
        </div>
    );
}

export default CustomerFormPage;
