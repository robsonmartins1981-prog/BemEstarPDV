
import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Search, DollarSign, Trash2, Edit2, ChevronRight, History, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import { db, getPaginated } from '../../services/databaseService';
import { Customer, Sale, PaymentMethod, CashOperation } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { safeFormat } from '../../utils/dateUtils';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { v4 as uuidv4 } from 'uuid';

interface CustomerManagementProps {
  onNewCustomer: () => void;
  onEditCustomer: (id: string) => void;
}

const ITEMS_PER_PAGE = 12;

const CustomerManagement: React.FC<CustomerManagementProps> = ({ onNewCustomer, onEditCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [customerDebts, setCustomerDebts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let currentCustomers: Customer[] = [];
      if (searchTerm) {
        const allCustomers = await db.getAll('customers');
        currentCustomers = allCustomers.filter(c => 
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          c.cpf.includes(searchTerm)
        ).slice(0, 100);
        setTotalCount(currentCustomers.length);
      } else {
        currentCustomers = await getPaginated('customers', ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
        const count = await db.count('customers');
        setTotalCount(count);
      }
      
      setCustomers(currentCustomers);

      // Calcular dívidas apenas para os clientes visíveis
      const debts: Record<string, number> = {};
      for (const customer of currentCustomers) {
        const customerSales = await db.getAllFromIndex('sales', 'customerId', customer.id);
        const debt = customerSales.reduce((total, sale) => {
          const notinhaPayments = (sale.payments || []).filter(p => 
            p.method === PaymentMethod.NOTINHA && 
            p.customerId === customer.id && 
            !p.settled
          );
          return total + notinhaPayments.reduce((sum, p) => sum + p.amount, 0);
        }, 0);
        debts[customer.id] = debt;
      }
      setCustomerDebts(debts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await db.delete('customers', id);
      
      await loadData();
    } catch (error) {
      alert('Erro ao excluir cliente.');
    }
  };

  const handlePayDebt = async () => {
    if (!selectedCustomer) return;
    const amountToPay = parseFloat(paymentAmount.replace(',', '.'));
    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert('Informe um valor válido para o pagamento.');
      return;
    }

    const currentDebt = customerDebts[selectedCustomer.id] || 0;
    if (amountToPay > currentDebt) {
      if (!confirm(`O valor informado (${formatCurrency(amountToPay)}) é maior que a dívida atual (${formatCurrency(currentDebt)}). Deseja continuar?`)) return;
    }

    try {
      // 1. Encontrar as sessões de caixa abertas para registrar a operação
      const allSessions = await db.getAll('cashSessions');
      const openSession = allSessions.find(s => s.status === 'OPEN');
      
      if (!openSession) {
        alert('É necessário ter um caixa aberto para registrar o pagamento.');
        return;
      }

      // 2. Marcar as "Notinhas" como pagas proporcionalmente
      let remainingPayment = amountToPay;
      const customerSales = await db.getAllFromIndex('sales', 'customerId', selectedCustomer.id);
      
      for (const sale of customerSales) {
        if (remainingPayment <= 0) break;
        
        const notinhaPayments = (sale.payments || []).filter(p => 
          p.method === PaymentMethod.NOTINHA && 
          p.customerId === selectedCustomer.id && 
          !p.settled
        );

        if (notinhaPayments.length === 0) continue;

        for (const p of notinhaPayments) {
          if (remainingPayment <= 0) break;
          
          if (p.amount <= remainingPayment) {
            remainingPayment -= p.amount;
            p.settled = true;
            p.settledAt = new Date().toISOString();
          } else {
            const paidPart = remainingPayment;
            p.amount -= paidPart;
            remainingPayment = 0;
            
            sale.payments.push({
              method: paymentMethod,
              amount: paidPart,
              settled: true,
              settledAt: new Date().toISOString()
            });
          }
        }
        
        await db.put('sales', sale);
      }

      // 3. Registrar a operação no caixa
      const newOp: CashOperation = {
        id: uuidv4(),
        sessionId: openSession.id,
        type: 'VENDA',
        amount: amountToPay,
        date: new Date().toISOString(),
        description: `Recebimento de Notinha: ${selectedCustomer.name}`,
        paymentMethod: paymentMethod
      };
      await db.put('cashOperations', newOp);

      alert('Pagamento registrado com sucesso!');
      setShowDebtModal(false);
      setPaymentAmount('');
      await loadData();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento.');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-theme-primary/20 outline-none"
          />
        </div>
        <Button onClick={onNewCustomer}>
          <UserPlus size={20} className="mr-2" /> Novo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-12 text-center">
            <Users size={64} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold uppercase text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          customers.map(customer => {
            const debt = customerDebts[customer.id] || 0;
            return (
              <div key={customer.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-theme-primary/10 text-theme-primary rounded-full flex items-center justify-center font-black text-xl">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">{customer.name}</h3>
                      <p className="text-xs text-gray-400">CPF: {customer.cpf}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditCustomer(customer.id)} className="p-2 text-gray-400 hover:text-theme-primary transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteCustomer(customer.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={clsx(
                    "p-3 rounded-xl flex justify-between items-center",
                    debt > 0 ? "bg-red-50 dark:bg-red-900/20 text-red-600" : "bg-green-50 dark:bg-green-900/20 text-green-600"
                  )}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Débito em Aberto</p>
                      <p className="text-lg font-black">{formatCurrency(debt)}</p>
                    </div>
                    {debt > 0 && (
                      <button 
                        onClick={() => { setSelectedCustomer(customer); setShowDebtModal(true); }}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                      >
                        <DollarSign size={18} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Limite</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatCurrency(customer.creditLimit || 0)}</p>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Disponível</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{formatCurrency((customer.creditLimit || 0) - debt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginação */}
      {!searchTerm && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            Página {page + 1} de {totalPages} ({totalCount} clientes)
          </p>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Pagamento de Dívida */}
      <Modal
        isOpen={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        title="Receber Pagamento de Notinha"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1" onClick={() => setShowDebtModal(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handlePayDebt}>Confirmar Recebimento</Button>
          </div>
        }
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
              <div className="w-12 h-12 bg-theme-primary/10 text-theme-primary rounded-full flex items-center justify-center font-black text-xl">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{selectedCustomer.name}</p>
                <p className="text-xs text-red-600 font-bold">Dívida Total: {formatCurrency(customerDebts[selectedCustomer.id] || 0)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Valor a Pagar (R$)</label>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-xl outline-none focus:border-theme-primary transition-all text-2xl font-black text-right font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Forma de Recebimento</label>
                <div className="grid grid-cols-2 gap-2">
                  {[PaymentMethod.DINHEIRO, PaymentMethod.PIX, PaymentMethod.DEBITO, PaymentMethod.CREDITO].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={clsx(
                        "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                        paymentMethod === method ? "border-theme-primary bg-theme-primary/5 text-theme-primary" : "border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200"
                      )}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerManagement;

// Helper function for conditional classes
function clsx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
