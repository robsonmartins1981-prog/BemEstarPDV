
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Supplier, Expense } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { PlusCircle, Edit, Trash2, Search, Truck, Phone, Mail, FileText, CheckCircle, Clock } from 'lucide-react';

interface SupplierManagementProps {
    onNewSupplier: () => void;
    onEditSupplier: (id: string) => void;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ onNewSupplier, onEditSupplier }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplierExpenses, setSupplierExpenses] = useState<Expense[]>([]);

    const fetchSuppliers = useCallback(async () => {
        const all = await db.getAll('suppliers');
        setSuppliers(all.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleSupplierClick = async (supplier: Supplier) => {
        const allExpenses = await db.getAll('expenses');
        const related = allExpenses.filter(e => e.supplierId === supplier.id)
            .sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        
        setSupplierExpenses(related);
        setSelectedSupplier(supplier);
    };

    const handleDelete = async (id: string) => {
        const products = await db.getAll('products');
        const hasProducts = products.some(p => p.supplierId === id);
        
        if (hasProducts) {
            alert('Não é possível excluir este fornecedor pois existem produtos vinculados a ele.');
            return;
        }

        if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
            await db.delete('suppliers', id);
            fetchSuppliers();
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cnpj.includes(searchTerm) ||
        s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Nome, CNPJ ou Contato..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-theme-primary"
                    />
                </div>
                <Button onClick={onNewSupplier}>
                    <PlusCircle size={18}/> Novo Fornecedor
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-[10px] uppercase font-black text-gray-400">
                        <tr>
                            <th className="px-6 py-4">Razão Social / Nome</th>
                            <th className="px-6 py-4 text-center">CNPJ</th>
                            <th className="px-6 py-4">Contato / Representante</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredSuppliers.map(supplier => (
                            <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer" onClick={() => handleSupplierClick(supplier)}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-500">
                                            <Truck size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">{supplier.name}</p>
                                            {supplier.email && (
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                                                    <Mail size={10} /> {supplier.email}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                                    {supplier.cnpj}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-600 dark:text-gray-300 text-xs">{supplier.contactPerson || 'Não informado'}</p>
                                    {supplier.phone && (
                                        <div className="flex items-center gap-1 text-[10px] text-theme-primary font-black uppercase">
                                            <Phone size={10} /> {supplier.phone}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-center gap-2">
                                        <Button variant="secondary" className="!p-2 h-auto" onClick={() => onEditSupplier(supplier.id)}>
                                            <Edit size={16}/>
                                        </Button>
                                        <Button variant="danger" className="!p-2 h-auto" onClick={() => handleDelete(supplier.id)}>
                                            <Trash2 size={16}/>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredSuppliers.length === 0 && (
                    <div className="p-20 text-center text-gray-400 flex flex-col items-center gap-4">
                        <Truck size={48} className="opacity-10" />
                        <p className="font-bold uppercase text-xs tracking-widest">Nenhum fornecedor cadastrado</p>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes de Contas do Fornecedor */}
            <Modal
                isOpen={!!selectedSupplier}
                onClose={() => setSelectedSupplier(null)}
                title={`Histórico de Contas: ${selectedSupplier?.name}`}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {supplierExpenses.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                            Nenhum título lançado para este fornecedor.
                        </div>
                    ) : (
                        supplierExpenses.map(expense => (
                            <div key={expense.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-xs uppercase text-gray-700 dark:text-gray-200">{expense.description}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase mt-1">Vencimento: {new Date(expense.dueDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-black text-theme-primary">{formatCurrency(expense.amount)}</p>
                                    {expense.status === 'PAID' ? (
                                        <span className="inline-flex items-center gap-1 text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">
                                            <CheckCircle size={10}/> Pago
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                                            <Clock size={10}/> Pendente
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default SupplierManagement;
