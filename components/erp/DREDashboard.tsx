
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/databaseService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const DREDashboard: React.FC = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const [s, e, emp] = await Promise.all([
                db.getAll('sales'),
                db.getAll('expenses'),
                db.getAll('employees')
            ]);
            setSales(s);
            setExpenses(e);
            setEmployees(emp);
        };
        load();
    }, []);

    const dreData = useMemo(() => {
        const revenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
        
        // CMV Simplificado: soma do custo unitário dos itens vendidos
        const cmv = sales.reduce((acc, s) => {
            return acc + s.items.reduce((iAcc: number, item: any) => iAcc + (item.quantity * (item.costPrice || 0)), 0);
        }, 0);

        const operationalExpenses = expenses
            .filter(e => e.status === 'PAID')
            .reduce((acc, e) => acc + e.amount, 0);

        const staffCosts = employees
            .filter(emp => emp.status === 'ACTIVE')
            .reduce((acc, emp) => acc + emp.salary, 0);

        const grossProfit = revenue - cmv;
        const netProfit = grossProfit - operationalExpenses - staffCosts;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return { revenue, cmv, grossProfit, operationalExpenses, staffCosts, netProfit, margin };
    }, [sales, expenses, employees]);

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const chartData = [
        { name: 'Receita', value: dreData.revenue, color: '#00843D' },
        { name: 'CMV', value: dreData.cmv, color: '#E87722' },
        { name: 'Desp. Operacionais', value: dreData.operationalExpenses, color: '#F9B208' },
        { name: 'Folha Pagto', value: dreData.staffCosts, color: '#1E3A63' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-b-4 border-theme-primary">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Faturamento Total</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{formatCurrency(dreData.revenue)}</span>
                        <ArrowUpRight className="text-theme-primary" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-b-4 border-theme-secondary">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Lucro Bruto</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{formatCurrency(dreData.grossProfit)}</span>
                        <TrendingUp className="text-theme-secondary" />
                    </div>
                </div>
                <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-b-4 ${dreData.netProfit >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Resultado Líquido</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className={`text-2xl font-black ${dreData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(dreData.netProfit)}</span>
                        {dreData.netProfit >= 0 ? <ArrowUpRight className="text-green-500" /> : <ArrowDownRight className="text-red-500" />}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-b-4 border-theme-darkblue">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Margem Líquida</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-2xl font-black text-theme-darkblue dark:text-blue-300">{dreData.margin.toFixed(1)}%</span>
                        <PieIcon className="text-theme-darkblue" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm h-[400px]">
                    <h3 className="text-sm font-black text-gray-400 uppercase mb-6 tracking-widest">Composição de Custos e Receita</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip formatter={(v: any) => formatCurrency(v)} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                {chartData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-black text-gray-400 uppercase mb-4 tracking-widest">DRE Analítico (Mensal)</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="font-bold text-gray-500">1. Receita Operacional Bruta</span>
                            <span className="font-black text-green-600">{formatCurrency(dreData.revenue)}</span>
                        </div>
                        <div className="flex justify-between p-3 border-b dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-500">(-) CMV (Custo de Vendas)</span>
                            <span className="text-sm font-bold text-red-500">({formatCurrency(dreData.cmv)})</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <span className="font-bold text-gray-500">2. Lucro Bruto</span>
                            <span className="font-black text-gray-800 dark:text-gray-100">{formatCurrency(dreData.grossProfit)}</span>
                        </div>
                        <div className="flex justify-between p-3 border-b dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-500">(-) Despesas Administrativas</span>
                            <span className="text-sm font-bold text-red-500">({formatCurrency(dreData.operationalExpenses)})</span>
                        </div>
                        <div className="flex justify-between p-3 border-b dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-500">(-) Folha de Pagamento / RH</span>
                            <span className="text-sm font-bold text-red-500">({formatCurrency(dreData.staffCosts)})</span>
                        </div>
                        <div className="flex justify-between p-4 bg-theme-primary text-white rounded-xl shadow-lg">
                            <span className="font-black uppercase tracking-tighter">Lucro Líquido do Exercício</span>
                            <span className="font-black text-xl">{formatCurrency(dreData.netProfit)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DREDashboard;
