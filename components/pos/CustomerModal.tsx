
import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { Customer } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Search, UserPlus, AlertCircle } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

// Função utilitária para validar CPF
const isValidCPF = (cpf: string): boolean => {
    if (!cpf) return false;
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/[^\d]+/g, '');

    if (cleanCPF.length !== 11) return false;

    // Elimina CPFs com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    let remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
};

// Componente para o formulário de cliente (versão simplificada para o modal).
const CustomerForm: React.FC<{ onSave: (customer: Customer) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Customer>>({ name: '', cpf: '', phone: '', address: '' });
    const [formError, setFormError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setFormError(''); // Limpa erro ao digitar
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.name || !formData.cpf) {
            setFormError('Nome e CPF são obrigatórios.');
            return;
        }

        if (!isValidCPF(formData.cpf)) {
            setFormError('O CPF informado é inválido.');
            return;
        }

        const newCustomer: Customer = {
            id: uuidv4(),
            name: formData.name,
            cpf: formData.cpf,
            phone: formData.phone,
            address: formData.address,
        };
        await db.add('customers', newCustomer);
        onSave(newCustomer);
    };

    const inputStyle = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold">Novo Cliente</h3>
            
            {formError && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {formError}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium">Nome Completo</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className={inputStyle} autoFocus/>
            </div>
            <div>
                <label className="block text-sm font-medium">CPF</label>
                <input type="text" name="cpf" value={formData.cpf || ''} onChange={handleChange} required className={inputStyle} placeholder="000.000.000-00"/>
            </div>
            <div>
                <label className="block text-sm font-medium">Telefone</label>
                <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
                <label className="block text-sm font-medium">Endereço</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className={inputStyle} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Voltar à Busca</Button>
                <Button type="submit" variant="primary">Salvar e Selecionar</Button>
            </div>
        </form>
    );
};

// Componente principal do modal de Clientes no PDV.
const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSelectCustomer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [view, setView] = useState<'search' | 'form'>('search');
    const [selectionError, setSelectionError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
            setSearchTerm('');
            setResults([]);
            setView('search');
            setSelectionError('');
        }
    }, [isOpen]);

    const handleSearch = async (query: string) => {
        setSearchTerm(query);
        setSelectionError(''); // Limpa erro ao buscar
        if (query.length < 2) {
            setResults([]);
            return;
        }
        const allCustomers = await db.getAll('customers');
        const lowerCaseQuery = query.toLowerCase();
        const filtered = allCustomers.filter(c => 
            c.name.toLowerCase().includes(lowerCaseQuery) || c.cpf.includes(query)
        );
        setResults(filtered);
    };

    const handleSelectClick = (customer: Customer) => {
        if (!isValidCPF(customer.cpf)) {
            setSelectionError(`O cliente "${customer.name}" possui um CPF inválido (${customer.cpf}). Não é possível selecioná-lo para emissão fiscal.`);
            return;
        }
        setSelectionError('');
        onSelectCustomer(customer);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Selecionar Cliente">
            {view === 'search' ? (
                <div className="space-y-4">
                    {selectionError && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-md text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <span>{selectionError}</span>
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            value={searchTerm}
                            onChange={e => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                            autoFocus
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {results.map(customer => (
                            <div key={customer.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div>
                                    <p className="font-semibold">{customer.name}</p>
                                    <p className="text-sm text-gray-500">{customer.cpf}</p>
                                </div>
                                <Button variant="primary" className="text-sm !py-1 !px-3" onClick={() => handleSelectClick(customer)}>
                                    Selecionar
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t dark:border-gray-700">
                        <Button className="w-full" onClick={() => setView('form')}>
                           <UserPlus size={18} /> Novo Cadastro
                        </Button>
                    </div>
                </div>
            ) : (
                <CustomerForm 
                    onSave={onSelectCustomer}
                    onCancel={() => setView('search')}
                />
            )}
        </Modal>
    );
};

export default CustomerModal;
