
import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, Trash2, Mail, Phone, User, ArrowLeft, Calendar, Filter, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { Supplier, Expense } from '../../types';

interface SupplierManagementProps {
  onNewSupplier: () => void;
  onEditSupplier: (id: string) => void;
}

const SupplierManagement: React.FC<SupplierManagementProps> = ({ onNewSupplier, onEditSupplier }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierExpenses, setSupplierExpenses] = useState<Expense[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplierId) {
      fetchSupplierExpenses(selectedSupplierId);
    }
  }, [selectedSupplierId]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierExpenses = async (supplierId: string) => {
    try {
      const allExpenses = await db.getAll('expenses');
      const filtered = allExpenses.filter(e => e.supplierId === supplierId);
      setSupplierExpenses(filtered);
    } catch (error) {
      console.error('Error fetching supplier expenses:', error);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      try {
        await db.delete('suppliers', id);
        setDeleteConfirmId(null);
        fetchSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cnpj.includes(searchTerm)
  );

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);

  const filteredExpenses = supplierExpenses.filter(e => {
    const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const purchaseDate = new Date(e.purchaseDate);
    const matchesStart = !startDate || purchaseDate >= new Date(startDate);
    const matchesEnd = !endDate || purchaseDate <= new Date(endDate);
    return matchesStatus && matchesStart && matchesEnd;
  }).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  const stats = {
    totalPaid: filteredExpenses.filter(e => e.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0),
    totalPending: filteredExpenses.filter(e => e.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0),
    totalHistorical: filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (selectedSupplierId && selectedSupplier) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedSupplierId(null)} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">{selectedSupplier.name}</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CNPJ: {selectedSupplier.cnpj}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-500">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pago</p>
            </div>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{formatCurrency(stats.totalPaid)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-500">
                <Clock size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Aberto</p>
            </div>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{formatCurrency(stats.totalPending)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-theme-primary/10 rounded-xl text-theme-primary">
                <DollarSign size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gasto Histórico</p>
            </div>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{formatCurrency(stats.totalHistorical)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Histórico de Títulos</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border dark:border-gray-700">
                <button 
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'ALL' ? 'bg-white dark:bg-gray-800 text-theme-primary shadow-sm' : 'text-gray-400'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFilterStatus('PAID')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'PAID' ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm' : 'text-gray-400'}`}
                >
                  Pagos
                </button>
                <button 
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'PENDING' ? 'bg-white dark:bg-gray-800 text-red-500 shadow-sm' : 'text-gray-400'}`}
                >
                  Pendentes
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:border-theme-primary"
                />
                <span className="text-gray-400 text-xs font-black">ATÉ</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-3 py-2 outline-none focus:border-theme-primary"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Compra</th>
                  <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                  <th className="text-left p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</th>
                  <th className="text-right p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                  <th className="text-center p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(expense.purchaseDate).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{expense.description}</p>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-black text-gray-800 dark:text-white">{formatCurrency(expense.amount)}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          expense.status === 'PAID' 
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {expense.status === 'PAID' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400 font-bold uppercase text-xs">
                      Nenhum título encontrado para este fornecedor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:border-theme-primary"
          />
        </div>
        <Button onClick={onNewSupplier}>
          <Plus size={20} className="mr-2" /> Novo Fornecedor
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        </div>
      ) : filteredSuppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <div 
              key={supplier.id} 
              onClick={() => setSelectedSupplierId(supplier.id)}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-6 hover:shadow-md transition-all cursor-pointer group hover:border-theme-primary/50"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-theme-primary/10 p-3 rounded-2xl group-hover:bg-theme-primary group-hover:text-white transition-colors">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onEditSupplier(supplier.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-theme-primary transition-colors">
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(supplier.id)} 
                    className={`p-2 rounded-full transition-all flex items-center gap-1 ${
                      deleteConfirmId === supplier.id 
                        ? 'bg-red-500 text-white hover:bg-red-600 px-3' 
                        : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={deleteConfirmId === supplier.id ? 'Clique novamente para confirmar' : 'Excluir fornecedor'}
                  >
                    <Trash2 size={18} />
                    {deleteConfirmId === supplier.id && <span className="text-[10px] font-black uppercase">Confirmar?</span>}
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-black text-gray-800 dark:text-white mb-1 uppercase truncate">{supplier.name}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">CNPJ: {supplier.cnpj}</p>

              <div className="space-y-2">
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <User size={14} />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Phone size={14} />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Mail size={14} />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                <span className="text-[10px] font-black text-theme-primary uppercase tracking-widest">Ver Detalhes</span>
                <ArrowLeft size={16} className="text-theme-primary rotate-180" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-12 text-center">
          <Truck size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold uppercase text-sm">Nenhum fornecedor encontrado</p>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
