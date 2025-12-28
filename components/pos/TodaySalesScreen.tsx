
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Sale } from '../../types';
import Button from '../shared/Button';
import { ReceiptText, Clock, ShoppingBag, CreditCard, ChevronDown, ChevronUp, Search, Calendar, ArrowLeft } from 'lucide-react';

interface TodaySalesScreenProps {
  onBack: () => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const TodaySalesScreen: React.FC<TodaySalesScreenProps> = ({ onBack }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      const allSales = await db.getAll('sales');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySales = allSales
        .filter(sale => new Date(sale.date) >= today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setSales(todaySales);
    };
    fetchSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerCPF?.includes(searchTerm) ||
      s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sales, searchTerm]);

  const dailyTotal = useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  }, [filteredSales]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full space-y-6">
        
        {/* Cabeçalho da Janela */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <ReceiptText className="text-theme-primary" /> Vendas do Dia
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-1">
                <Calendar size={12} /> {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por item, CPF ou ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
        </div>

        {/* Dash de Totais Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-primary/10 p-4 rounded-2xl border border-theme-primary/20">
            <p className="text-[10px] font-bold text-theme-primary uppercase">Faturamento Bruto</p>
            <p className="text-2xl font-black text-theme-primary">{formatCurrency(dailyTotal)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Qtd. Vendas</p>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{filteredSales.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Ticket Médio</p>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">
              {filteredSales.length > 0 ? formatCurrency(dailyTotal / filteredSales.length) : 'R$ 0,00'}
            </p>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {filteredSales.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingBag size={64} className="mx-auto mb-4 opacity-10" />
              <p className="text-lg font-medium">Nenhuma venda registrada até o momento.</p>
            </div>
          ) : (
            filteredSales.map(sale => (
              <div 
                key={sale.id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md"
              >
                <button 
                  onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-5 text-left">
                    <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-xl text-theme-primary">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 dark:text-gray-100 text-lg leading-tight">{formatTime(new Date(sale.date))}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {sale.items.length} ITENS {sale.customerCPF ? `• CPF: ${sale.customerCPF}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-black text-xl text-theme-primary">{formatCurrency(sale.totalAmount)}</p>
                      <span className="text-[9px] text-gray-400 uppercase font-bold">ID: {sale.id.split('-')[0]}</span>
                    </div>
                    {expandedSaleId === sale.id ? <ChevronUp size={24} className="text-gray-400" /> : <ChevronDown size={24} className="text-gray-400" />}
                  </div>
                </button>

                {expandedSaleId === sale.id && (
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Lista de Itens */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Detalhamento dos Itens</p>
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex gap-2">
                            <span className="font-bold text-theme-primary">{item.quantity}x</span>
                            <span className="text-gray-700 dark:text-gray-300">{item.productName}</span>
                          </div>
                          <span className="font-mono font-bold">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pagamentos */}
                    <div className="pt-4 border-t dark:border-gray-700 flex flex-wrap gap-2">
                      {sale.payments.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary text-white rounded-lg text-xs font-bold shadow-sm">
                          <CreditCard size={14} />
                          <span className="uppercase">{p.method}</span>
                          <span className="bg-white/20 px-1.5 py-0.5 rounded">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                      {sale.change > 0 && (
                        <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                          TROCO: {formatCurrency(sale.change)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé da Janela */}
        <div className="pt-4 border-t dark:border-gray-800 flex justify-end shrink-0">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft size={18} className="mr-2" /> Voltar ao Caixa
            </Button>
        </div>
      </div>
    </div>
  );
};

export default TodaySalesScreen;
