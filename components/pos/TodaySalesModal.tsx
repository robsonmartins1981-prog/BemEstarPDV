
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../shared/Modal';
import { db } from '../../services/databaseService';
import type { Sale } from '../../types';
import { ReceiptText, Clock, ShoppingBag, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface TodaySalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const TodaySalesModal: React.FC<TodaySalesModalProps> = ({ isOpen, onClose }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  const dailyTotal = useMemo(() => {
    return sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  }, [sales]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vendas do Dia">
      <div className="space-y-4 max-h-[70vh] flex flex-col">
        
        {/* Resumo do Dia */}
        <div className="bg-theme-primary/10 p-4 rounded-xl border border-theme-primary/20 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Faturamento de Hoje</p>
            <p className="text-2xl font-black text-theme-primary">{formatCurrency(dailyTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase">Vendas</p>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{sales.length}</p>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className="flex-grow overflow-y-auto space-y-2 pr-1">
          {sales.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
              <p>Nenhuma venda realizada hoje.</p>
            </div>
          ) : (
            sales.map(sale => (
              <div 
                key={sale.id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all shadow-sm"
              >
                <button 
                  onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{formatTime(new Date(sale.date))}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {sale.items.length} item(ns) {sale.customerCPF ? '• CPF na Nota' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <p className="font-black text-lg text-theme-primary">{formatCurrency(sale.totalAmount)}</p>
                    {expandedSaleId === sale.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </button>

                {expandedSaleId === sale.id && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/30 border-t dark:border-gray-700 space-y-3">
                    {/* Lista de Itens Curta */}
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{item.quantity}x {item.productName}</span>
                          <span className="font-mono">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pagamentos */}
                    <div className="pt-2 border-t dark:border-gray-700 flex flex-wrap gap-2">
                      {sale.payments.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-bold">
                          <CreditCard size={10} className="text-theme-primary" />
                          <span className="text-gray-500 uppercase">{p.method}:</span>
                          <span className="text-theme-primary">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                      {sale.change > 0 && (
                        <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded text-[10px] font-bold">
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
      </div>
    </Modal>
  );
};

export default TodaySalesModal;
