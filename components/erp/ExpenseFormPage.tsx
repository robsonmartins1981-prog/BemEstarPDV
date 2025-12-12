
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import Button from '../shared/Button';
import { Save, Calendar, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseFormPageProps {
  expenseId?: string;
  onBack: () => void;
}

const ExpenseFormPage: React.FC<ExpenseFormPageProps> = ({ expenseId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Expense>>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const allSuppliers = await db.getAll('suppliers');
            setSuppliers(allSuppliers.sort((a,b) => a.name.localeCompare(b.name)));

            if (expenseId) {
                const expense = await db.get('expenses', expenseId);
                if (expense) {
                    setFormData(expense);
                } else {
                    console.error("Expense not found");
                    onBack();
                }
            } else {
                setFormData({
                    id: uuidv4(),
                    description: '',
                    amount: 0,
                    supplierId: '',
                    dueDate: new Date(),
                    status: 'PENDING',
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [expenseId, onBack]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else if (name === 'status') {
            const status = value as 'PENDING' | 'PAID';
            setFormData(prev => ({ 
                ...prev, 
                status,
                // Se marcou como pago e não tem data de pagamento, define hoje
                paidDate: status === 'PAID' && !prev.paidDate ? new Date() : prev.paidDate 
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (value) {
            // Cria a data ajustando o fuso horário para evitar problemas de dia anterior
            const dateObj = new Date(value + 'T12:00:00'); 
            setFormData(prev => ({ ...prev, [name]: dateObj }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || formData.amount === undefined || formData.amount <= 0 || !formData.dueDate) {
            alert('Descrição, Valor e Data de Vencimento são obrigatórios.');
            return;
        }

        await db.put('expenses', formData as Expense);
        onBack();
    };

    // Formata Date para string YYYY-MM-DD para o input type="date"
    const formatDateForInput = (date?: Date) => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    if (isLoading) {
        return <div className="text-center p-8">Carregando dados...</div>;
    }

    const inputStyle = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-theme-primary focus:ring-theme-primary dark:border-gray-600 dark:bg-gray-700";

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                {expenseId ? 'Editar Conta a Pagar' : 'Nova Despesa'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Descrição</label>
                    <input 
                        type="text" 
                        name="description" 
                        value={formData.description || ''} 
                        onChange={handleChange} 
                        required 
                        placeholder="Ex: Conta de Luz, Compra de Mercadoria..."
                        className={inputStyle} 
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Valor (R$)</label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign size={16} className="text-gray-500"/>
                            </div>
                            <input 
                                type="number" 
                                name="amount" 
                                value={formData.amount || ''} 
                                onChange={handleChange} 
                                required 
                                min="0.01" 
                                step="0.01" 
                                className={`${inputStyle} pl-10`} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Fornecedor (Opcional)</label>
                        <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className={inputStyle}>
                            <option value="">Selecione...</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Data de Vencimento</label>
                        <div className="relative mt-1">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={16} className="text-gray-500"/>
                            </div>
                            <input 
                                type="date" 
                                name="dueDate" 
                                value={formatDateForInput(formData.dueDate)} 
                                onChange={handleDateChange} 
                                required 
                                className={`${inputStyle} pl-10`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
                            <option value="PENDING">Pendente</option>
                            <option value="PAID">Pago</option>
                        </select>
                    </div>
                </div>

                {formData.status === 'PAID' && (
                    <div>
                        <label className="block text-sm font-medium">Data do Pagamento</label>
                        <input 
                            type="date" 
                            name="paidDate" 
                            value={formatDateForInput(formData.paidDate)} 
                            onChange={handleDateChange} 
                            required 
                            className={inputStyle} 
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary">
                        <Save size={16} className="mr-2"/> 
                        {expenseId ? 'Atualizar' : 'Salvar Despesa'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ExpenseFormPage;
