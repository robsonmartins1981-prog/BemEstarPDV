
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { Sale } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { Search, Filter, Calendar, Download, ReceiptText, User, Clock, ChevronRight } from 'lucide-react';
import Button from '../shared/Button';

const SalesReport: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadSales();
  }, [dateFilter]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateFilter.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);

      // Usar o índice de data para buscar apenas o intervalo necessário
      const range = IDBKeyRange.bound(startDate.toISOString(), endDate.toISOString());
      const filteredSales = await db.getAllFromIndex('sales', 'date', range);
      
      setSales(filteredSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Erro ao carregar relatório de vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customerCPF && sale.customerCPF.includes(searchTerm))
  );

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalSalesCount = filteredSales.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total em Vendas</p>
          <p className="text-2xl font-black text-theme-primary">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Qtd. de Vendas</p>
          <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{totalSalesCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ticket Médio</p>
          <p className="text-2xl font-black text-emerald-500">{formatCurrency(totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar ID ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-theme-primary/20"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="text-gray-400 w-4 h-4" />
              <input 
                type="date" 
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm py-2 px-3 focus:ring-2 focus:ring-theme-primary/20"
              />
              <span className="text-gray-400">até</span>
              <input 
                type="date" 
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm py-2 px-3 focus:ring-2 focus:ring-theme-primary/20"
              />
            </div>
          </div>
          
          <Button variant="secondary" size="sm" onClick={() => {}}>
            <Download size={16} className="mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">ID / Data</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Cliente</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest">Pagamento</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Valor</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mx-auto"></div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 italic">Nenhuma venda encontrada no período.</td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">#{sale.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                          <Clock size={10} /> {new Date(sale.date).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{sale.customerCPF || 'Consumidor Final'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {sale.payments.map((p, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[8px] font-black uppercase rounded-full text-gray-500">
                            {p.method}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-black text-theme-primary">{formatCurrency(sale.totalAmount)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-theme-primary transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
