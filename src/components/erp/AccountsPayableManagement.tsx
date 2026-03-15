import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Calendar, CheckCircle, Clock, Filter } from 'lucide-react';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import { safeLocaleDateString } from '../../utils/dateUtils';

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      await db.delete('expenses', id);
      fetchData();
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

  const totalPending = filteredAccounts
    .filter(a => a.status === 'PENDING')
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pendente</p>
          <p className="text-2xl font-black text-red-500">R$ {totalPending.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contas Filtradas</p>
          <p className="text-2xl font-black text-theme-primary">{filteredAccounts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm flex items-end">
          <Button onClick={onNewAccount} className="w-full">
            <Plus size={20} className="mr-2" /> Nova Conta
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
                return (
                  <tr key={account.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                        <span className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                          {safeLocaleDateString(account.dueDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800 dark:text-white uppercase">{account.description}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getSupplierName(account.supplierId)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-gray-800 dark:text-white">R$ {account.amount.toFixed(2)}</span>
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
                      <div className="flex justify-end gap-2">
                        <button onClick={() => onEditAccount(account.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-theme-primary transition-colors">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(account.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
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
