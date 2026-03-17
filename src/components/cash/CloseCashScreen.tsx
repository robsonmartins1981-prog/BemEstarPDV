
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { CashSession, CashOperation, Sale } from '../../types';
import { formatCurrency, formatDecimal, parseCurrencyInput } from '../../utils/formatUtils';
import { safeLocaleString, safeDate } from '../../utils/dateUtils';
import Button from '../shared/Button';
import { LogOut, DollarSign, ArrowRightLeft, ShoppingCart, FileText, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface CloseCashScreenProps {
  session: CashSession;
  onClose: (finalAmount: number, notes?: string) => void;
}

const CloseCashScreen: React.FC<CloseCashScreenProps> = ({ session, onClose }) => {
  const [operations, setOperations] = useState<CashOperation[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [finalAmount, setFinalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allOps, allSales] = await Promise.all([
          db.getAll('cashOperations'),
          db.getAll('sales')
        ]);
        
        // Filtrar operações e vendas desta sessão
        const sessionOps = allOps.filter(op => op.sessionId === session.id);
        const sessionSales = allSales.filter(sale => {
            // Se a venda não tem sessionId, tentamos inferir pela data ou se está na lista da sessão
            if (sale.sessionId) return sale.sessionId === session.id;
            // Fallback: se a venda foi feita após a abertura da sessão
            const saleDate = safeDate(sale.date);
            const sessionOpenedAt = safeDate(session.openedAt);
            if (!saleDate || !sessionOpenedAt) return false;
            return saleDate >= sessionOpenedAt;
        });

        setOperations(sessionOps);
        setSales(sessionSales);
      } catch (error) {
        console.error("Erro ao carregar dados do fechamento:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session.id, session.openedAt]);

  const totalSuprimentos = operations.filter(op => op.type === 'SUPRIMENTO' || op.type === 'REFORCO').reduce((acc, op) => acc + op.amount, 0);
  const totalSangrias = operations.filter(op => op.type === 'SANGRIA').reduce((acc, op) => acc + op.amount, 0);
  const totalSales = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  
  // Vendas por forma de pagamento
  const salesByMethod = sales.reduce((acc, sale) => {
    sale.payments.forEach(p => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
    });
    return acc;
  }, {} as Record<string, number>);

  const expectedAmount = session.initialAmount + (salesByMethod['DINHEIRO'] || 0) + totalSuprimentos - totalSangrias;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseCurrencyInput(finalAmount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      alert('Por favor, insira um valor de fechamento válido.');
      return;
    }
    onClose(numericAmount, notes);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p className="animate-pulse font-black uppercase text-gray-400">Processando Fechamento...</p></div>;

  const difference = parseCurrencyInput(finalAmount) - expectedAmount;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <header className="bg-white dark:bg-gray-800 shadow-sm p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
            <LogOut size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Fechamento de Caixa</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sessão: {session.terminalId} / Aberto em: {safeLocaleString(session.openedAt)}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={16} /> Resumo Financeiro
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">Abertura (Suprimento)</span>
                <span className="font-mono font-bold">{formatCurrency(session.initialAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">Vendas em Dinheiro</span>
                <span className="font-mono font-bold text-emerald-500">+{ formatCurrency(salesByMethod['DINHEIRO'] || 0) }</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">Outros Suprimentos</span>
                <span className="font-mono font-bold text-emerald-500">+{ formatCurrency(totalSuprimentos) }</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">Total de Sangrias</span>
                <span className="font-mono font-bold text-red-500">-{ formatCurrency(totalSangrias) }</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-gray-50 dark:bg-gray-700/50 px-4 rounded-xl mt-4">
                <span className="text-gray-800 dark:text-gray-200 font-black uppercase text-xs">Saldo Esperado em Caixa</span>
                <span className="text-xl font-black text-theme-primary">{ formatCurrency(expectedAmount) }</span>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShoppingCart size={16} /> Vendas por Forma de Pagamento
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(salesByMethod).map(([method, amount]) => (
                <div key={method} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border dark:border-gray-600">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{method}</p>
                  <p className="text-lg font-black text-gray-800 dark:text-gray-100">{formatCurrency(amount as number)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-theme-primary/10 rounded-xl flex justify-between items-center">
              <span className="text-xs font-black text-theme-primary uppercase">Total de Vendas do Turno</span>
              <span className="text-xl font-black text-theme-primary">{formatCurrency(totalSales)}</span>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-2 border-theme-primary/20 dark:border-theme-primary/40 space-y-6">
            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight text-center">Conferência de Valores</h2>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor Físico Contado em Dinheiro</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                <input
                  type="text"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(formatDecimal(parseCurrencyInput(e.target.value)))}
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 rounded-2xl text-3xl font-mono font-black text-right focus:border-theme-primary focus:ring-0 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {finalAmount && !isNaN(parseCurrencyInput(finalAmount)) && (
              <div className={`p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 ${difference === 0 ? 'bg-emerald-100 text-emerald-700' : difference > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                {difference === 0 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">Diferença de Caixa</p>
                  <p className="text-xl font-black">{formatCurrency(difference)}</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase">{difference === 0 ? 'Caixa Conferido com Sucesso' : difference > 0 ? 'Sobra de Caixa Identificada' : 'Quebra de Caixa Identificada'}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observações Adicionais</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Diferença devido a erro no troco..."
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 rounded-2xl text-sm min-h-[100px] focus:border-theme-primary focus:ring-0"
              />
            </div>

            <Button type="submit" className="w-full py-5 text-lg rounded-2xl shadow-lg shadow-theme-primary/20" variant="primary">
              <LogOut size={24} className="mr-2" /> Encerrar Turno e Fechar Caixa
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CloseCashScreen;
