import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { Save, ArrowLeft, Calendar, DollarSign, FileText, Truck, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
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
    purchaseDate: new Date(),
    status: 'PENDING',
    supplierId: '',
    isFixed: false
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
        purchaseDate: formData.purchaseDate instanceof Date ? formData.purchaseDate : new Date(formData.purchaseDate || new Date()),
        status: formData.status || 'PENDING',
        supplierId: formData.supplierId,
        isFixed: formData.isFixed || false,
        subItems: formData.subItems,
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
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Data da Compra</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="date" 
                required
                value={formData.purchaseDate instanceof Date ? formData.purchaseDate.toISOString().split('T')[0] : new Date(formData.purchaseDate!).toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, purchaseDate: new Date(e.target.value) })}
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

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl">
            <input 
              type="checkbox" 
              id="isFixed"
              checked={formData.isFixed || false}
              onChange={(e) => setFormData({ ...formData, isFixed: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-theme-primary focus:ring-theme-primary"
            />
            <label htmlFor="isFixed" className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest cursor-pointer">
              Custo Fixo (Recorrente)
            </label>
          </div>
        </div>

        {/* Sub-items Section (Credit Card Detail) */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-theme-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Detalhamento da Fatura (Opcional)</h3>
            </div>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => {
                const newSubItems = [...(formData.subItems || []), { id: uuidv4(), description: '', amount: 0 }];
                setFormData({ ...formData, subItems: newSubItems });
              }}
            >
              Adicionar Item
            </Button>
          </div>
          
          <div className="space-y-3">
            {(formData.subItems || []).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border dark:border-gray-700 shadow-sm">
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Descrição do gasto"
                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-800 dark:text-white"
                    value={item.description}
                    onChange={(e) => {
                      const newSubItems = [...(formData.subItems || [])];
                      newSubItems[idx].description = e.target.value;
                      setFormData({ ...formData, subItems: newSubItems });
                    }}
                  />
                </div>
                <div className="w-32 flex items-center gap-2 border-l dark:border-gray-700 pl-3">
                  <span className="text-[10px] font-black text-gray-400">R$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    className="w-full bg-transparent border-none outline-none text-xs font-bold text-gray-800 dark:text-white"
                    value={item.amount}
                    onChange={(e) => {
                      const newSubItems = [...(formData.subItems || [])];
                      newSubItems[idx].amount = parseFloat(e.target.value) || 0;
                      
                      // Auto-update total amount if it's a credit card bill
                      const totalSubItems = newSubItems.reduce((acc, curr) => acc + curr.amount, 0);
                      setFormData({ ...formData, subItems: newSubItems, amount: totalSubItems });
                    }}
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const newSubItems = (formData.subItems || []).filter((_, i) => i !== idx);
                    const totalSubItems = newSubItems.reduce((acc, curr) => acc + curr.amount, 0);
                    setFormData({ ...formData, subItems: newSubItems, amount: totalSubItems > 0 ? totalSubItems : formData.amount });
                  }}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {(formData.subItems || []).length === 0 && (
              <p className="text-center py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Nenhum item detalhado. O valor total será usado.
              </p>
            )}
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
