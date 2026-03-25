
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { Expense, Sale, Category } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Calendar, Filter, ArrowUpRight, ArrowDownRight, PieChart, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalOutstandingDebt, setTotalOutstandingDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateFilter.start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);

      const [periodExpenses, periodSales, allCategories, pendingExpenses] = await Promise.all([
        db.getAllFromIndex('expenses', 'purchaseDate', IDBKeyRange.bound(startDate, endDate)),
        db.getAllFromIndex('sales', 'date', IDBKeyRange.bound(startDate, endDate)),
        db.getAll('categories'),
        db.getAllFromIndex('expenses', 'status', 'PENDING')
      ]);

      setExpenses(periodExpenses);
      setSales(periodSales);
      setCategories(allCategories);
      setTotalOutstandingDebt(pendingExpenses.reduce((acc, curr) => acc + curr.amount, 0));
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalSpendInPeriod = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalRevenueInPeriod = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);

  // Spend by Nature (Category)
  const spendByNature = categories.map(cat => {
    const amount = expenses
      .filter(e => e.categoryId === cat.id)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      name: cat.name,
      amount,
      percentage: totalSpendInPeriod > 0 ? (amount / totalSpendInPeriod) * 100 : 0
    };
  }).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount);

  // Add "Uncategorized" if any
  const uncategorizedAmount = expenses
    .filter(e => !e.categoryId)
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  if (uncategorizedAmount > 0) {
    spendByNature.push({
      name: 'Não Categorizado',
      amount: uncategorizedAmount,
      percentage: totalSpendInPeriod > 0 ? (uncategorizedAmount / totalSpendInPeriod) * 100 : 0
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-theme-primary" size={20} />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Período de Análise</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={dateFilter.start}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              className="text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-theme-primary"
            />
            <span className="text-gray-400 text-[10px] font-black">ATÉ</span>
            <input 
              type="date" 
              value={dateFilter.end}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              className="text-[10px] font-black uppercase bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-theme-primary"
            />
          </div>
          <div className="p-2 bg-theme-primary/10 text-theme-primary rounded-xl">
            <Filter size={18} />
          </div>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Faturamento (Período)</p>
          <p className="text-2xl font-black text-emerald-500">{formatCurrency(totalRevenueInPeriod)}</p>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase">
            <ArrowUpRight size={12} />
            <span>Entradas Reais</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} className="text-red-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gasto no Período</p>
          <p className="text-2xl font-black text-red-500">{formatCurrency(totalSpendInPeriod)}</p>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-red-500 uppercase">
            <ArrowDownRight size={12} />
            <span>Baseado na Data Compra</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={64} className="text-theme-primary" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dívida Total Pendente</p>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{formatCurrency(totalOutstandingDebt)}</p>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
            <Clock size={12} />
            <span>Global (A Pagar)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={64} className="text-blue-500" />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resultado Operacional</p>
          <p className={`text-2xl font-black ${totalRevenueInPeriod - totalSpendInPeriod >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(totalRevenueInPeriod - totalSpendInPeriod)}
          </p>
          <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
            <PieChart size={12} />
            <span>Lucro/Prejuízo Estimado</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Nature */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart size={20} className="text-theme-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Gastos por Natureza</h2>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Categorias</span>
          </div>
          <div className="p-6 space-y-6">
            {spendByNature.length > 0 ? (
              spendByNature.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatCurrency(item.amount)}</p>
                    </div>
                    <p className="text-xs font-black text-theme-primary">{item.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-theme-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-400 font-bold uppercase text-xs">Nenhum gasto registrado no período</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity or other chart could go here */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm p-6 flex flex-col justify-center items-center text-center">
          <BarChart3 size={64} className="text-gray-100 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight mb-2">Análise de Fluxo</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            Utilize os filtros acima para detalhar a saúde financeira do seu negócio baseada no momento real das compras.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
