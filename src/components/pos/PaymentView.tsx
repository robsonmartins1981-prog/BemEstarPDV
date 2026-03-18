import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDecimal, parseCurrencyInput } from '../../utils/formatUtils';
import { PaymentMethod, Payment, Customer } from '../../types';
import { CreditCard, Banknote, QrCode, User, Plus, Trash2, Search, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { db } from '../../services/databaseService';
import Button from '../shared/Button';

interface PaymentViewProps {
  totalAmount: number;
  onFinalize: (payments: Payment[], change: number, shouldPrint: boolean) => void;
  onCancel: () => void;
  selectedCustomer?: Customer | null;
}

const PaymentView: React.FC<PaymentViewProps> = ({ totalAmount, onFinalize, onCancel, selectedCustomer: initialCustomer }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentAmount, setCurrentAmount] = useState(formatDecimal(totalAmount));
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, totalAmount - totalPaid);
  const change = Math.max(0, totalPaid - totalAmount);

  const [shouldPrint, setShouldPrint] = useState(() => {
    const saved = localStorage.getItem('pos_should_print');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    setPayments([]);
    setCurrentAmount(formatDecimal(totalAmount));
    setSelectedCustomer(initialCustomer || null);
    loadCustomers();
  }, [totalAmount, initialCustomer]);

  const loadCustomers = async () => {
    const all = await db.getAll('customers');
    setCustomers(all);
  };

  useEffect(() => {
    setCurrentAmount(formatDecimal(remaining));
  }, [remaining]);

  const handleAddPayment = () => {
    const numericAmount = parseCurrencyInput(currentAmount);
    if (numericAmount <= 0) return;

    if (selectedMethod === PaymentMethod.NOTINHA && !selectedCustomer) {
      alert('Para pagamentos em "Notinha", é necessário selecionar um cliente.');
      setShowCustomerSearch(true);
      return;
    }

    setPayments(prev => [...prev, { 
      method: selectedMethod, 
      amount: numericAmount,
      customerId: selectedMethod === PaymentMethod.NOTINHA ? selectedCustomer?.id : undefined,
      settled: selectedMethod !== PaymentMethod.NOTINHA,
      settledAt: selectedMethod !== PaymentMethod.NOTINHA ? new Date().toISOString() : undefined
    }]);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (totalPaid < totalAmount) {
      alert('O valor total pago é menor que o total da venda.');
      return;
    }
    
    localStorage.setItem('pos_should_print', shouldPrint.toString());
    onFinalize(payments, change, shouldPrint);
  };

  const methods = [
    { id: PaymentMethod.DINHEIRO, label: 'Dinheiro', icon: Banknote, color: 'emerald' },
    { id: PaymentMethod.PIX, label: 'PIX', icon: QrCode, color: 'blue' },
    { id: PaymentMethod.DEBITO, label: 'Débito', icon: CreditCard, color: 'indigo' },
    { id: PaymentMethod.CREDITO, label: 'Crédito', icon: CreditCard, color: 'violet' },
    { id: PaymentMethod.NOTINHA, label: 'Notinha', icon: User, color: 'amber' },
  ];

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpf.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-left duration-300">
      <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-theme-primary" />
          </button>
          <h2 className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white">Finalizar Pagamento</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Restante</p>
            <p className="text-xl font-black text-theme-primary">{formatCurrency(remaining)}</p>
          </div>
          <Button variant="success" size="sm" onClick={handleConfirm} disabled={totalPaid < totalAmount}>
            <CheckCircle2 size={18} className="mr-2" /> Confirmar
          </Button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {methods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${selectedMethod === method.id ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-500'}`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                </button>
              ))}
            </div>

            {selectedMethod === PaymentMethod.NOTINHA && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest">Cliente da Notinha</p>
                  <button 
                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                    className="text-xs font-bold text-amber-600 underline"
                  >
                    {selectedCustomer ? 'Trocar Cliente' : 'Selecionar Cliente'}
                  </button>
                </div>
                
                {selectedCustomer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-amber-600">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{selectedCustomer.name}</p>
                      <p className="text-xs text-gray-500">CPF: {selectedCustomer.cpf}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 italic">Nenhum cliente selecionado</p>
                )}

                {showCustomerSearch && (
                  <div className="space-y-2 mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Pesquisar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
                          className="w-full text-left p-2 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-lg text-sm transition-colors"
                        >
                          {c.name} - {c.cpf}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Valor a Adicionar (R$)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(formatDecimal(parseCurrencyInput(e.target.value)))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
                    className="flex-grow px-6 py-4 bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:border-theme-primary transition-all text-3xl font-black text-right font-mono"
                    autoFocus
                  />
                  <button
                    onClick={handleAddPayment}
                    className="px-6 bg-theme-primary text-white rounded-2xl hover:bg-theme-primary/90 transition-all shadow-lg shadow-theme-primary/20"
                  >
                    <Plus size={32} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="flex-grow bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col min-h-[300px]">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Pagamentos Adicionados</h3>
              </div>
              <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {payments.map((p, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in slide-in-from-right duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-theme-primary/10 text-theme-primary rounded-xl">
                        {(() => {
                          const method = methods.find(m => m.id === p.method);
                          if (!method) return null;
                          const Icon = method.icon;
                          return <Icon size={20} />;
                        })()}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-gray-800 dark:text-white">{p.method}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {p.method === PaymentMethod.NOTINHA ? `Cliente: ${customers.find(c => c.id === p.customerId)?.name || 'N/A'}` : 'Confirmado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-black text-theme-primary">{formatCurrency(p.amount)}</p>
                      <button onClick={() => handleRemovePayment(index)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <Banknote size={48} className="text-gray-200 dark:text-gray-800" />
                    <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Nenhum pagamento adicionado</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">Troco a Devolver</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(change)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <input
                type="checkbox"
                id="shouldPrint"
                checked={shouldPrint}
                onChange={(e) => setShouldPrint(e.target.checked)}
                className="w-6 h-6 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"
              />
              <label htmlFor="shouldPrint" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                Imprimir Comanda / Nota Fiscal
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
