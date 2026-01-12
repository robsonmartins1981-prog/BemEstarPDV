
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import { EXPENSE_CATEGORIES } from '../../services/expenseCategories';
import Button from '../shared/Button';
import { Save, Calendar, DollarSign, Tag } from 'lucide-react';
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
                    categoryId: 'outros',
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
                paidDate: status === 'PAID' && !prev.paidDate ? new Date() : prev.paidDate 
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (value) {
            const dateObj = new Date(value + 'T12:00:00'); 
            setFormData(prev => ({ ...prev, [name]: dateObj }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || formData.amount === undefined || formData.amount <= 0 || !formData.dueDate || !formData.categoryId) {
            alert('Descrição, Valor, Vencimento e Categoria são obrigatórios.');
            return;
        }

        await db.put('expenses', formData as Expense);
        onBack();
    };

    const formatDateForInput = (date?: Date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    };

    if (isLoading) {
        return <div className="text-center p-8 text-gray-400 uppercase font-black text-xs animate-pulse">Carregando formulário financeiro...</div>;
    }

    const inputStyle = "mt-1 block w-full rounded-xl border border-gray-200 py-3 px-4 shadow-sm focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 dark:border-gray-700 dark:bg-gray-800 transition-all outline-none";

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-8 text-theme-darkblue">
                    <div className="p-3 bg-theme-darkblue/10 rounded-2xl">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-gray-100">
                            {expenseId ? 'Alterar Lançamento' : 'Novo Título a Pagar'}
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gestão de Obrigações Financeiras</p>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Descrição do Gasto</label>
                            <input 
                                type="text" 
                                name="description" 
                                value={formData.description || ''} 
                                onChange={handleChange} 
                                required 
                                placeholder="Ex: Pagamento Fornecedor de Trigo, Conta de Energia..."
                                className={inputStyle} 
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                <Tag size={12}/> Classificação DRE
                            </label>
                            <select 
                                name="categoryId" 
                                value={formData.categoryId} 
                                onChange={handleChange} 
                                required
                                className={inputStyle + " font-bold text-xs uppercase"}
                            >
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Valor do Título (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                <input 
                                    type="number" 
                                    name="amount" 
                                    value={formData.amount || ''} 
                                    onChange={handleChange} 
                                    required 
                                    min="0.01" 
                                    step="0.01" 
                                    className={inputStyle + " pl-10 font-mono font-black text-lg"} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Fornecedor Vinculado</label>
                            <select name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className={inputStyle}>
                                <option value="">Sem fornecedor específico</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Data de Vencimento</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="date" 
                                    name="dueDate" 
                                    value={formatDateForInput(formData.dueDate)} 
                                    onChange={handleDateChange} 
                                    required 
                                    className={inputStyle + " pl-12"}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Estado de Pagamento</label>
                            <select name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
                                <option value="PENDING">Pendente (A pagar)</option>
                                <option value="PAID">Pago (Liquidado)</option>
                            </select>
                        </div>

                        {formData.status === 'PAID' && (
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Data da Liquidação</label>
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
                    </div>

                    <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-700">
                        <Button type="button" variant="secondary" className="px-8 rounded-2xl" onClick={onBack}>Descartar</Button>
                        <Button type="submit" variant="primary" className="px-10 rounded-2xl shadow-lg shadow-theme-darkblue/20 bg-theme-darkblue hover:bg-slate-800">
                            <Save size={18} className="mr-2"/> 
                            {expenseId ? 'Confirmar Alteração' : 'Registrar Despesa'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseFormPage;
