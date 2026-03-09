
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import { EXPENSE_CATEGORIES } from '../../services/expenseCategories';
import Button from '../shared/Button';
import { Save, Calendar, DollarSign, Tag, CreditCard, List, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseFormPageProps {
  expenseId?: string;
  onBack: () => void;
}

interface Installment {
  id: string;
  number: number;
  dueDate: Date;
  amount: number;
}

const ExpenseFormPage: React.FC<ExpenseFormPageProps> = ({ expenseId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Expense>>({});
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Installment states
    const [paymentMethod, setPaymentMethod] = useState<string>('BOLETO');
    const [isInstallment, setIsInstallment] = useState<boolean>(false);
    const [installmentCount, setInstallmentCount] = useState<number>(2);
    const [installmentInterval, setInstallmentInterval] = useState<number>(30);
    const [installments, setInstallments] = useState<Installment[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const allSuppliers = await db.getAll('suppliers');
            setSuppliers(allSuppliers.sort((a,b) => a.name.localeCompare(b.name)));

            if (expenseId) {
                const expense = await db.get('expenses', expenseId);
                if (expense) {
                    setFormData(expense);
                    // Try to extract payment method if we saved it in description or if we add it to Expense type later.
                    // For now, we just use the default.
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

    const generateInstallments = () => {
        if (!formData.amount || !formData.dueDate) {
            alert('Preencha o valor e a data de vencimento inicial primeiro.');
            return;
        }
        const totalAmount = formData.amount;
        const baseAmount = Math.floor((totalAmount / installmentCount) * 100) / 100;
        let remainder = totalAmount - (baseAmount * installmentCount);
        
        const newInstallments: Installment[] = [];
        let currentDueDate = new Date(formData.dueDate);
        
        for (let i = 1; i <= installmentCount; i++) {
            const amount = i === 1 ? baseAmount + remainder : baseAmount;
            newInstallments.push({
                id: uuidv4(),
                number: i,
                dueDate: new Date(currentDueDate),
                amount: Number(amount.toFixed(2))
            });
            currentDueDate.setDate(currentDueDate.getDate() + installmentInterval);
        }
        setInstallments(newInstallments);
    };

    const handleInstallmentChange = (id: string, field: keyof Installment, value: any) => {
        setInstallments(prev => prev.map(inst => {
            if (inst.id === id) {
                if (field === 'dueDate') {
                    return { ...inst, [field]: new Date(value + 'T12:00:00') };
                }
                return { ...inst, [field]: value };
            }
            return inst;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.description || formData.amount === undefined || formData.amount <= 0 || !formData.dueDate || !formData.categoryId) {
            alert('Descrição, Valor, Vencimento e Categoria são obrigatórios.');
            return;
        }

        if (!expenseId && isInstallment && installments.length > 0) {
            // Validate installments total
            const totalInstallments = installments.reduce((sum, inst) => sum + inst.amount, 0);
            if (Math.abs(totalInstallments - formData.amount) > 0.05) {
                alert(`A soma das parcelas (R$ ${totalInstallments.toFixed(2)}) difere do valor total (R$ ${formData.amount.toFixed(2)}). Ajuste os valores.`);
                return;
            }

            // Save multiple expenses
            for (const inst of installments) {
                const installmentExpense: Expense = {
                    ...(formData as Expense),
                    id: uuidv4(),
                    description: `${formData.description} (${inst.number}/${installmentCount}) - ${paymentMethod}`,
                    amount: inst.amount,
                    dueDate: inst.dueDate,
                };
                await db.put('expenses', installmentExpense);
            }
        } else {
            // Save single expense
            const expenseToSave: Expense = {
                ...(formData as Expense),
                description: !expenseId ? `${formData.description} - ${paymentMethod}` : formData.description
            };
            await db.put('expenses', expenseToSave);
        }
        
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Valor Total (R$)</label>
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Data de Vencimento {isInstallment && '(1ª Parcela)'}</label>
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

                        {!expenseId && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                        <CreditCard size={12}/> Forma de Pagamento
                                    </label>
                                    <select 
                                        value={paymentMethod} 
                                        onChange={(e) => setPaymentMethod(e.target.value)} 
                                        className={inputStyle}
                                    >
                                        <option value="BOLETO">Boleto Bancário</option>
                                        <option value="PIX">PIX</option>
                                        <option value="DINHEIRO">Dinheiro</option>
                                        <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                                        <option value="TRANSFERENCIA">Transferência Bancária</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                        <List size={12}/> Condição de Pagamento
                                    </label>
                                    <select 
                                        value={isInstallment ? 'PARCELADO' : 'A_VISTA'} 
                                        onChange={(e) => {
                                            setIsInstallment(e.target.value === 'PARCELADO');
                                            if (e.target.value === 'A_VISTA') setInstallments([]);
                                        }} 
                                        className={inputStyle}
                                    >
                                        <option value="A_VISTA">À Vista (Parcela Única)</option>
                                        <option value="PARCELADO">Parcelado</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {expenseId && (
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Estado de Pagamento</label>
                                <select name="status" value={formData.status} onChange={handleChange} className={inputStyle}>
                                    <option value="PENDING">Pendente (A pagar)</option>
                                    <option value="PAID">Pago (Liquidado)</option>
                                </select>
                            </div>
                        )}

                        {expenseId && formData.status === 'PAID' && (
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

                    {!expenseId && isInstallment && (
                        <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase mb-4 flex items-center gap-2">
                                <List size={16} /> Configuração de Parcelamento
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Qtd. Parcelas</label>
                                    <input 
                                        type="number" 
                                        value={installmentCount} 
                                        onChange={(e) => setInstallmentCount(parseInt(e.target.value) || 2)} 
                                        min="2" 
                                        max="120"
                                        className={inputStyle} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Intervalo (Dias)</label>
                                    <select 
                                        value={installmentInterval} 
                                        onChange={(e) => setInstallmentInterval(parseInt(e.target.value))} 
                                        className={inputStyle}
                                    >
                                        <option value="7">Semanal (7 dias)</option>
                                        <option value="10">Decendial (10 dias)</option>
                                        <option value="15">Quinzenal (15 dias)</option>
                                        <option value="30">Mensal (30 dias)</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button type="button" onClick={generateInstallments} className="w-full h-[46px] rounded-xl bg-theme-secondary hover:bg-theme-secondary-hover text-white shadow-md">
                                        <RefreshCw size={16} className="mr-2" /> Gerar Parcelas
                                    </Button>
                                </div>
                            </div>

                            {installments.length > 0 && (
                                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[10px] text-gray-400 uppercase font-black bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3">Parcela</th>
                                                <th className="px-4 py-3">Vencimento</th>
                                                <th className="px-4 py-3">Valor (R$)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {installments.map((inst, index) => (
                                                <tr key={inst.id}>
                                                    <td className="px-4 py-2 font-bold text-gray-700 dark:text-gray-300">
                                                        {inst.number} / {installmentCount}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="date" 
                                                            value={formatDateForInput(inst.dueDate)} 
                                                            onChange={(e) => handleInstallmentChange(inst.id, 'dueDate', e.target.value)}
                                                            className="w-full rounded-lg border border-gray-200 py-1.5 px-3 text-sm focus:border-theme-primary focus:ring-1 focus:ring-theme-primary outline-none dark:bg-gray-900 dark:border-gray-700"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input 
                                                            type="number" 
                                                            value={inst.amount} 
                                                            onChange={(e) => handleInstallmentChange(inst.id, 'amount', parseFloat(e.target.value) || 0)}
                                                            step="0.01"
                                                            min="0"
                                                            className="w-full rounded-lg border border-gray-200 py-1.5 px-3 text-sm font-mono focus:border-theme-primary focus:ring-1 focus:ring-theme-primary outline-none dark:bg-gray-900 dark:border-gray-700"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-3 text-right text-[10px] font-black uppercase text-gray-500">Total das Parcelas:</td>
                                                <td className="px-4 py-3 font-mono font-black text-theme-darkblue">
                                                    R$ {installments.reduce((sum, inst) => sum + inst.amount, 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

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
