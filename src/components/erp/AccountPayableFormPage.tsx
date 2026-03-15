import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { Save, ArrowLeft, Calendar, DollarSign, FileText, Truck } from 'lucide-react';
import { db } from '../../services/databaseService';
import type { Expense, Supplier } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface AccountPayableFormPageProps {
  accountId?: string;
  onBack: () => void;
}

const AccountPayableFormPage: React.FC<AccountPayableFormPageProps> = ({ accountId, onBack }) => {
  const [formData, setFormData] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    dueDate: new Date(),
    status: 'PENDING',
    supplierId: ''
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [accountId]);

  const loadData = async () => {
    const suppliersData = await db.getAll('suppliers');
    setSuppliers(suppliersData.sort((a, b) => a.name.localeCompare(b.name)));

    if (accountId) {
      const account = await db.get('expenses', accountId);
      if (account) {
        setFormData(account);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const account: Expense = {
        id: accountId || uuidv4(),
        description: formData.description || '',
        amount: formData.amount || 0,
        dueDate: formData.dueDate instanceof Date ? formData.dueDate : new Date(formData.dueDate!),
        status: formData.status || 'PENDING',
        supplierId: formData.supplierId,
        paidDate: formData.status === 'PAID' ? (formData.paidDate || new Date()) : undefined
      };

      await db.put('expenses', account);
      onBack();
    } catch (error) {
      console.error('Error saving account payable:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">
          {accountId ? 'Editar Conta' : 'Nova Conta'}
        </h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Descrição da Conta</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Aluguel, Compra de Mercadorias, Luz..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Fornecedor (Opcional)</label>
            <div className="relative">
              <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white appearance-none"
              >
                <option value="">Nenhum fornecedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Valor da Conta</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Data de Vencimento</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="date" 
                required
                value={formData.dueDate instanceof Date ? formData.dueDate.toISOString().split('T')[0] : new Date(formData.dueDate!).toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary text-gray-800 dark:text-white" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Status de Pagamento</label>
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'PENDING' })}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === 'PENDING' ? 'bg-white dark:bg-gray-800 text-red-500 shadow-sm' : 'text-gray-400'}`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'PAID' })}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === 'PAID' ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm' : 'text-gray-400'}`}
              >
                Pago
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            <Save size={18} className="mr-2" /> {loading ? 'Salvando...' : 'Salvar Conta'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountPayableFormPage;
