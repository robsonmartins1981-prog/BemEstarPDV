
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, Filter, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface ExpenseManagementProps {
    onNewExpense: () => void;
    onEditExpense: (id: string) => void;
}

const ExpenseManagement: React.FC<ExpenseManagementProps> = ({ onNewExpense, onEditExpense }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [suppliers, setSuppliers] = useState<Map<string, string>>(new Map());
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');

    const fetchData = useCallback(async () => {
        const [allExpenses, allSuppliers] = await Promise.all([
            db.getAll('expenses'),
            db.getAll('suppliers')
        ]);
        
        // Mapeia ID -> Nome do fornecedor para exibição rápida
        const supplierMap = new Map<string, string>();
        allSuppliers.forEach(s => supplierMap.set(s.id, s.name));
        setSuppliers(supplierMap);

        // Ordena por vencimento (mais recentes/próximos primeiro)
        setExpenses(allExpenses.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta despesa?')) {
            await db.delete('expenses', id);
            fetchData();
        }
    };

    const handleMarkAsPaid = async (expense: Expense) => {
        const updatedExpense = { ...expense, status: 'PAID' as const, paidDate: new Date() };
        await db.put('expenses', updatedExpense);
        fetchData();
    };

    // --- LÓGICA DE FILTRAGEM E CÁLCULO ---
    const today = new Date();
    today.setHours(0,0,0,0);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const dueDate = new Date(exp.dueDate);
            dueDate.setHours(0,0,0,0);
            
            if (filterStatus === 'ALL') return true;
            if (filterStatus === 'PAID') return exp.status === 'PAID';
            if (filterStatus === 'PENDING') return exp.status === 'PENDING';
            if (filterStatus === 'OVERDUE') return exp.status === 'PENDING' && dueDate < today;
            return true;
        });
    }, [expenses, filterStatus, today]);

    const totals = useMemo(() => {
        let pending = 0;
        let overdue = 0;
        let paid = 0;

        expenses.forEach(exp => {
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
    }, [expenses, today]);

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (date: Date) => new Date(date).toLocaleDateString('pt-BR');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-semibold">Contas a Pagar</h2>
                <Button onClick={onNewExpense}><PlusCircle size={18}/> Nova Despesa</Button>
            </div>

            {/* DASHBOARD RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendente (Geral)</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.pending)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-red-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vencido / Atrasado</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.overdue)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4 border-green-500">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pago (Total Histórico)</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</p>
                </div>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'ALL' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                    Todas
                </button>
                <button onClick={() => setFilterStatus('PENDING')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'PENDING' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    Pendentes
                </button>
                <button onClick={() => setFilterStatus('OVERDUE')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'OVERDUE' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                    Vencidas
                </button>
                 <button onClick={() => setFilterStatus('PAID')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === 'PAID' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                    Pagas
                </button>
            </div>

            {/* TABELA DE DESPESAS */}
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Descrição</th>
                            <th className="px-6 py-3">Fornecedor</th>
                            <th className="px-6 py-3">Vencimento</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(expense => {
                            const dueDate = new Date(expense.dueDate);
                            dueDate.setHours(0,0,0,0);
                            const isOverdue = expense.status === 'PENDING' && dueDate < today;

                            return (
                                <tr key={expense.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                    <td className="px-6 py-3 font-medium">{expense.description}</td>
                                    <td className="px-6 py-3">{expense.supplierId ? suppliers.get(expense.supplierId) || 'Fornecedor Excluído' : '-'}</td>
                                    <td className={`px-6 py-3 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                                        {formatDate(expense.dueDate)}
                                        {isOverdue && <span className="text-xs block">Vencido</span>}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-base">{formatCurrency(expense.amount)}</td>
                                    <td className="px-6 py-3 text-center">
                                        {expense.status === 'PAID' ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full text-xs font-semibold">
                                                <CheckCircle size={14}/> Pago
                                            </span>
                                        ) : isOverdue ? (
                                             <span className="inline-flex items-center gap-1 text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full text-xs font-semibold">
                                                <AlertCircle size={14}/> Atrasado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full text-xs font-semibold">
                                                <Clock size={14}/> Aberto
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            {expense.status === 'PENDING' && (
                                                <Button size="sm" variant="success" className="p-2 h-auto" onClick={() => handleMarkAsPaid(expense)} title="Marcar como Pago">
                                                    <DollarSign size={16} />
                                                </Button>
                                            )}
                                            <Button variant="secondary" size="sm" className="p-2 h-auto" onClick={() => onEditExpense(expense.id)}><Edit size={16}/></Button>
                                            <Button variant="danger" size="sm" className="p-2 h-auto" onClick={() => handleDelete(expense.id)}><Trash2 size={16}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredExpenses.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        Nenhuma conta encontrada com este filtro.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpenseManagement;
