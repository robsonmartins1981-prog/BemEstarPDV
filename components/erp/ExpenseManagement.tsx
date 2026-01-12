
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import { getCategoryLabel, EXPENSE_CATEGORIES } from '../../services/expenseCategories';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, Filter, AlertCircle, CheckCircle, Clock, DollarSign, Tag } from 'lucide-react';

interface ExpenseManagementProps {
    onNewExpense: () => void;
    onEditExpense: (id: string) => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ onNewExpense, onEditExpense }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [suppliers, setSuppliers] = useState<Map<string, string>>(new Map());
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');

    const fetchData = useCallback(async () => {
        const [allExpenses, allSuppliers] = await Promise.all([
            db.getAll('expenses'),
            db.getAll('suppliers')
        ]);
        
        const supplierMap = new Map<string, string>();
        allSuppliers.forEach(s => supplierMap.set(s.id, s.name));
        setSuppliers(supplierMap);

        setExpenses(allExpenses.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: string) => {
        if (confirm('Deseja excluir este lançamento financeiro?')) {
            await db.delete('expenses', id);
            fetchData();
        }
    };

    const handleMarkAsPaid = async (expense: Expense) => {
        const updatedExpense = { ...expense, status: 'PAID' as const, paidDate: new Date() };
        await db.put('expenses', updatedExpense);
        fetchData();
    };

    const today = new Date();
    today.setHours(0,0,0,0);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const dueDate = new Date(exp.dueDate);
            dueDate.setHours(0,0,0,0);
            
            const matchesStatus = 
                filterStatus === 'ALL' || 
                (filterStatus === 'PAID' && exp.status === 'PAID') ||
                (filterStatus === 'PENDING' && exp.status === 'PENDING') ||
                (filterStatus === 'OVERDUE' && exp.status === 'PENDING' && dueDate < today);

            const matchesCategory = filterCategory === 'ALL' || exp.categoryId === filterCategory;

            return matchesStatus && matchesCategory;
        });
    }, [expenses, filterStatus, filterCategory, today]);

    const totals = useMemo(() => {
        let pending = 0;
        let overdue = 0;
        let paid = 0;

        filteredExpenses.forEach(exp => {
            const dueDate = new Date(exp.dueDate);
            dueDate.setHours(0,0,0,0);

            if (exp.status === 'PAID') {
                paid += exp.amount;
            } else {
                pending += exp.amount;
                if (dueDate < today) {
                    overdue += exp.amount;
                }
            }
        });
        return { pending, overdue, paid };
    }, [filteredExpenses, today]);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Fluxo de Contas a Pagar</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Classificação por Categorias DRE</p>
                </div>
                <Button onClick={onNewExpense} className="shadow-lg shadow-theme-primary/20">
                    <PlusCircle size={18}/> Novo Lançamento
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-blue-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pendente</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{formatCurrency(totals.pending)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencido / Atrasado</p>
                    <p className="text-2xl font-black text-red-600 mt-1">{formatCurrency(totals.overdue)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-l-4 border-green-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquidado (Filtro)</p>
                    <p className="text-2xl font-black text-green-600 mt-1">{formatCurrency(totals.paid)}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2 flex-grow">
                    <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Todas</button>
                    <button onClick={() => setFilterStatus('PENDING')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'PENDING' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Em Aberto</button>
                    <button onClick={() => setFilterStatus('OVERDUE')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'OVERDUE' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Vencidas</button>
                    <button onClick={() => setFilterStatus('PAID')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'PAID' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Pagas</button>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <Filter size={14} className="text-gray-400 ml-2" />
                    <select 
                        value={filterCategory} 
                        onChange={e => setFilterCategory(e.target.value)}
                        className="text-[10px] font-black uppercase bg-transparent outline-none cursor-pointer pr-4"
                    >
                        <option value="ALL">Todas as Categorias</option>
                        {EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-gray-400 uppercase font-black bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-5">Categoria DRE</th>
                            <th className="px-6 py-5">Descrição / Motivo</th>
                            <th className="px-6 py-5">Vencimento</th>
                            <th className="px-6 py-5 text-right">Valor Título</th>
                            <th className="px-6 py-5 text-center">Status</th>
                            <th className="px-6 py-5 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredExpenses.map(expense => {
                            const dueDate = new Date(expense.dueDate);
                            dueDate.setHours(0,0,0,0);
                            const isOverdue = expense.status === 'PENDING' && dueDate < today;

                            return (
                                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black px-2 py-1 bg-theme-darkblue/5 text-theme-darkblue rounded-lg uppercase tracking-tighter">
                                            {getCategoryLabel(expense.categoryId)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-tight">{expense.description}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{expense.supplierId ? suppliers.get(expense.supplierId) : 'Despesa Geral'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-mono font-bold ${isOverdue ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
                                                {formatDate(expense.dueDate)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono font-black text-theme-darkblue text-base">{formatCurrency(expense.amount)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {expense.status === 'PAID' ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                                <CheckCircle size={12}/> Liquidado
                                            </span>
                                        ) : isOverdue ? (
                                             <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                                <AlertCircle size={12}/> Atrasado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                                <Clock size={12}/> Pendente
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            {expense.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => handleMarkAsPaid(expense)}
                                                    className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all"
                                                    title="Liquidar Título"
                                                >
                                                    <DollarSign size={16} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => onEditExpense(expense.id)}
                                                className="p-2 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                                            >
                                                <Edit size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredExpenses.length === 0 && (
                    <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/20">
                        <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum título encontrado para os filtros selecionados</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseManagement;
