import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Calendar, CheckCircle, Clock, Filter, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { safeLocaleDateString } from '../../utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';

interface AccountsPayableManagementProps {
  onNewAccount: () => void;
  onEditAccount: (id: string) => void;
}

const AccountsPayableManagement: React.FC<AccountsPayableManagementProps> = ({ onNewAccount, onEditAccount }) => {
  const [accounts, setAccounts] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [cloning, setCloning] = useState(false);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accountsData, suppliersData] = await Promise.all([
        db.getAll('expenses'),
        db.getAll('suppliers')
      ]);
      setAccounts(accountsData.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFixedCosts = async () => {
    if (!window.confirm('Deseja copiar todos os custos fixos do mês anterior para o mês atual?')) return;
    
    setCloning(true);
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const fixedCostsLastMonth = accounts.filter(acc => {
        const d = new Date(acc.purchaseDate || acc.dueDate);
        return acc.isFixed && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
      });

      if (fixedCostsLastMonth.length === 0) {
        alert('Nenhum custo fixo encontrado no mês anterior.');
        return;
      }

      for (const cost of fixedCostsLastMonth) {
        const newPurchaseDate = new Date(cost.purchaseDate || cost.dueDate);
        newPurchaseDate.setMonth(currentMonth);
        newPurchaseDate.setFullYear(currentYear);

        const newDueDate = new Date(cost.dueDate);
        newDueDate.setMonth(currentMonth);
        newDueDate.setFullYear(currentYear);

        const newExpense: Expense = {
          ...cost,
          id: uuidv4(),
          purchaseDate: newPurchaseDate,
          dueDate: newDueDate,
          status: 'PENDING',
          paidDate: undefined
        };

        await db.put('expenses', newExpense);
      }

      alert(`${fixedCostsLastMonth.length} custos fixos copiados com sucesso!`);
      fetchData();
    } catch (error) {
      console.error('Erro ao copiar custos fixos:', error);
      alert('Erro ao copiar custos fixos.');
    } finally {
      setCloning(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      try {
        await db.delete('expenses', id);
        setDeleteConfirmId(null);
        fetchData();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleToggleStatus = async (account: Expense) => {
    const updated: Expense = { 
      ...account, 
      status: account.status === 'PAID' ? 'PENDING' : 'PAID',
      paidDate: account.status === 'PAID' ? undefined : new Date()
    };
    await db.put('expenses', updated);
    fetchData();
  };

  const getSupplierName = (id?: string) => {
    if (!id) return 'Sem Fornecedor';
    return suppliers.find(s => s.id === id)?.name || 'Fornecedor não encontrado';
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         getSupplierName(acc.supplierId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPendingGlobal = accounts
    .filter(a => a.status === 'PENDING')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalFiltered = filteredAccounts.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dívida Total Pendente</p>
          <p className="text-2xl font-black text-red-500">{formatCurrency(totalPendingGlobal)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Filtrado</p>
          <p className="text-2xl font-black text-theme-primary">{formatCurrency(totalFiltered)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm flex flex-col gap-3">
          <Button onClick={onNewAccount} className="w-full">
            <Plus size={20} className="mr-2" /> Nova Conta
          </Button>
          <Button onClick={handleCopyFixedCosts} variant="secondary" className="w-full" disabled={cloning}>
            <Copy size={18} className="mr-2" /> {cloning ? 'Copiando...' : 'Copiar Custos Fixos'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por descrição ou fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:border-theme-primary"
          />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border dark:border-gray-700">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'ALL' ? 'bg-theme-primary text-white' : 'text-gray-400 hover:text-theme-primary'}`}
          >
            Todas
          </button>
          <button 
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'PENDING' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-red-500'}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setStatusFilter('PAID')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'PAID' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-emerald-500'}`}
          >
            Pagas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        </div>
      ) : filteredAccounts.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Compra</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição / Fornecedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => {
                const isOverdue = account.status === 'PENDING' && new Date(account.dueDate) < new Date();
                const isExpanded = expandedExpenseId === account.id;
                const hasSubItems = account.subItems && account.subItems.length > 0;

                return (
                  <React.Fragment key={account.id}>
                    <tr 
                      className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
                      onClick={() => hasSubItems && setExpandedExpenseId(isExpanded ? null : account.id)}
                    >
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        {safeLocaleDateString(account.purchaseDate || account.dueDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                        <span className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                          {safeLocaleDateString(account.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {hasSubItems && (
                          <div className="text-theme-primary">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white uppercase flex items-center gap-2">
                            {account.description}
                            {account.isFixed && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[8px] font-black uppercase tracking-widest">Fixo</span>
                            )}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getSupplierName(account.supplierId)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-gray-800 dark:text-white">{formatCurrency(account.amount)}</span>
                      {hasSubItems && (
                        <p className="text-[10px] font-black text-theme-primary uppercase tracking-widest mt-1">{account.subItems?.length} itens detalhados</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(account)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${account.status === 'PAID' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                      >
                        {account.status === 'PAID' ? <><CheckCircle size={12} /> Pago</> : <><Clock size={12} /> Pendente</>}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onEditAccount(account.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-theme-primary transition-colors">
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(account.id)} 
                          className={`p-2 rounded-full transition-all flex items-center gap-1 ${
                            deleteConfirmId === account.id 
                              ? 'bg-red-500 text-white hover:bg-red-600 px-3' 
                              : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={deleteConfirmId === account.id ? 'Clique novamente para confirmar' : 'Excluir conta'}
                        >
                          <Trash2 size={18} />
                          {deleteConfirmId === account.id && <span className="text-[10px] font-black uppercase">Confirmar?</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && hasSubItems && (
                    <tr className="bg-gray-50/50 dark:bg-gray-900/20 border-b dark:border-gray-700">
                      <td colSpan={6} className="px-12 py-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detalhamento da Fatura</p>
                          {account.subItems?.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-dashed dark:border-gray-700 last:border-0">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{item.description}</span>
                              <span className="text-xs font-black text-gray-800 dark:text-white">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-12 text-center">
          <FileText size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold uppercase text-sm">Nenhuma conta encontrada</p>
        </div>
      )}
    </div>
  );
};

export default AccountsPayableManagement;
