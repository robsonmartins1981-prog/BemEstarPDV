import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Settings, Building2, User, 
  Search, Plus, Copy, Home, Car, Utensils, Briefcase, CreditCard,
  ChevronDown, ChevronUp, CheckCircle2, Circle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Transaction, CategoryNature, CategoryType, Account } from '../types';
import { mockTransactions, mockNatures, mockTypes, mockAccounts } from '../mockData';

const ICONS: Record<string, React.ReactNode> = {
  Home: <Home size={16} />,
  Car: <Car size={16} />,
  Utensils: <Utensils size={16} />,
  Briefcase: <Briefcase size={16} />,
  CreditCard: <CreditCard size={16} />,
};

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'ALL' | 'FIXED' | 'VARIABLE' | 'INCOME'>('ALL');

  const currentMonthYear = format(currentDate, 'yyyy-MM');
  
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.monthYear !== currentMonthYear) return false;
      if (filter === 'FIXED') return t.type === 'FIXED_EXPENSE';
      if (filter === 'VARIABLE') return t.type === 'VARIABLE_EXPENSE';
      if (filter === 'INCOME') return t.type === 'INCOME';
      return true;
    });
  }, [transactions, currentMonthYear, filter]);

  const summary = useMemo(() => {
    let income = 0;
    let fixed = 0;
    let variable = 0;
    let creditCard = 0;

    transactions.filter(t => t.monthYear === currentMonthYear).forEach(t => {
      if (t.type === 'INCOME') income += t.amount;
      if (t.type === 'FIXED_EXPENSE') fixed += t.amount;
      if (t.type === 'VARIABLE_EXPENSE') variable += t.amount;
      if (t.type === 'CREDIT_CARD') creditCard += t.amount;
    });

    return {
      income,
      fixed,
      variable,
      creditCard,
      balance: income - fixed - variable - creditCard
    };
  }, [transactions, currentMonthYear]);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryDetails = (categoryId?: string) => {
    if (!categoryId) return null;
    const type = mockTypes.find(t => t.id === categoryId);
    if (!type) return null;
    const nature = mockNatures.find(n => n.id === type.natureId);
    return { type, nature };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Mock data for charts
  const lineChartData = [
    { name: 'Jan', Ganhos: 9000, Gastos: 8500 },
    { name: 'Fev', Ganhos: 9500, Gastos: 8000 },
    { name: 'Mar', Ganhos: 10000, Gastos: 3000 },
  ];

  const pieChartData = [
    { name: 'Moradia', value: 2000, color: '#3b82f6' },
    { name: 'Alimentação', value: 800, color: '#f97316' },
    { name: 'Cartão', value: 200, color: '#a855f7' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            $
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Finanças</h1>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 rounded-full p-1">
          <button 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 hover:bg-white rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium min-w-[120px] text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 hover:bg-white rounded-full transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Configurações">
            <Settings size={20} />
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Contas e Patrimônio">
            <Building2 size={20} />
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Perfil">
            <User size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Receitas</p>
            <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(summary.income)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Custos Fixos</p>
            <p className="text-2xl font-semibold text-rose-600">{formatCurrency(summary.fixed)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Custos Variáveis</p>
            <p className="text-2xl font-semibold text-orange-600">{formatCurrency(summary.variable)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Fatura Cartão</p>
            <p className="text-2xl font-semibold text-purple-600">{formatCurrency(summary.creditCard)}</p>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white">
            <p className="text-sm font-medium text-slate-400 mb-1">Saldo Restante</p>
            <p className="text-2xl font-semibold">{formatCurrency(summary.balance)}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-semibold mb-6">Evolução Anual</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(value) => `R$ ${value/1000}k`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line type="monotone" dataKey="Ganhos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Gastos" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-semibold mb-6">Distribuição por Natureza</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieChartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spreadsheet / Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar lançamento..." 
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64"
                />
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(['ALL', 'FIXED', 'VARIABLE', 'INCOME'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f === 'ALL' ? 'Todos' : f === 'FIXED' ? 'Fixos' : f === 'VARIABLE' ? 'Variáveis' : 'Receitas'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Copy size={16} />
                Copiar Mês Anterior
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                <Plus size={16} />
                Novo Lançamento
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium w-10"></th>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Descrição</th>
                  <th className="px-6 py-3 font-medium">Natureza</th>
                  <th className="px-6 py-3 font-medium">Tipo</th>
                  <th className="px-6 py-3 font-medium text-right">Valor</th>
                  <th className="px-6 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(tx => {
                  const details = getCategoryDetails(tx.categoryId);
                  const isCreditCard = tx.type === 'CREDIT_CARD';
                  const isExpanded = expandedRows.has(tx.id);

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className={`hover:bg-slate-50 transition-colors group ${isExpanded ? 'bg-slate-50' : ''}`}>
                        <td className="px-6 py-3">
                          {isCreditCard && (
                            <button 
                              onClick={() => toggleRow(tx.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                          {format(parseISO(tx.date), 'dd/MM')}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                            {tx.description}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {details?.nature && (
                            <div className="flex items-center gap-1.5">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${details.nature.color}`}>
                                {ICONS[details.nature.icon]}
                              </div>
                              <span className="text-slate-600">{details.nature.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          <span className="cursor-pointer hover:text-indigo-600 border-b border-transparent hover:border-indigo-200">
                            {details?.type.name || '-'}
                          </span>
                        </td>
                        <td className={`px-6 py-3 text-right font-medium ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          <span className="cursor-pointer hover:text-indigo-600 border-b border-transparent hover:border-indigo-200">
                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <button className={`p-1 rounded-full transition-colors ${tx.isPaid ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}>
                            {tx.isPaid ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Sub-table for Credit Card Items */}
                      {isCreditCard && isExpanded && tx.creditCardItems && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="p-0">
                            <div className="pl-20 pr-6 py-3 border-l-2 border-purple-500 ml-6 my-2">
                              <table className="w-full text-sm">
                                <tbody>
                                  {tx.creditCardItems.map(item => {
                                    const itemDetails = getCategoryDetails(item.categoryId);
                                    return (
                                      <tr key={item.id} className="hover:bg-slate-100/50 group/sub">
                                        <td className="py-2 text-slate-500 w-24">{format(parseISO(item.date), 'dd/MM')}</td>
                                        <td className="py-2 font-medium text-slate-700">{item.description}</td>
                                        <td className="py-2">
                                          {itemDetails?.nature && (
                                            <div className="flex items-center gap-1.5">
                                              <div className={`w-5 h-5 rounded flex items-center justify-center text-white text-[10px] ${itemDetails.nature.color}`}>
                                                {ICONS[itemDetails.nature.icon]}
                                              </div>
                                              <span className="text-slate-500 text-xs">{itemDetails.nature.name}</span>
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-2 text-slate-500 text-xs">{itemDetails?.type.name}</td>
                                        <td className="py-2 text-right font-medium text-slate-700">{formatCurrency(item.amount)}</td>
                                        <td className="py-2 w-16"></td>
                                      </tr>
                                    );
                                  })}
                                  <tr>
                                    <td colSpan={6} className="py-2">
                                      <button className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
                                        <Plus size={14} /> Adicionar Gasto no Cartão
                                      </button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
