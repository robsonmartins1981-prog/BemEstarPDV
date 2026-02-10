
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/databaseService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Wallet, Smartphone, CreditCard, ArrowUpRight, ArrowDownRight, LayoutDashboard, Receipt } from 'lucide-react';

const DREDashboard: React.FC = () => {
    const [sales, setSales] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [historicalCash, setHistoricalCash] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const [s, e, h] = await Promise.all([
                db.getAll('sales'),
                db.getAll('expenses'),
                db.getAll('historicalCash')
            ]);
            setSales(s);
            setExpenses(e);
            setHistoricalCash(h);
        };
        load();
    }, []);

    const totals = useMemo(() => {
        // Receita de vendas atuais + Fechamentos históricos
        const currentSalesRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
        const historicalRevenue = historicalCash.reduce((acc, h) => acc + h.totalGross, 0);
        const grossRevenue = currentSalesRevenue + historicalRevenue;

        // Despesas
        const paidExpenses = expenses.filter(e => e.status === 'PAID').reduce((acc, e) => acc + e.amount, 0);
        const pendingExpenses = expenses.filter(e => e.status === 'PENDING').reduce((acc, e) => acc + e.amount, 0);

        const netBalance = grossRevenue - paidExpenses;

        // Origem do Recurso (Mix de Pagamento)
        // Somando dados históricos + vendas atuais
        let mix = { cash: 0, pix: 0, debit: 0, credit: 0 };
        
        historicalCash.forEach(h => {
            mix.cash += (h.cash || 0);
            mix.pix += (h.pix || 0);
            mix.debit += (h.debit || 0);
            mix.credit += (h.credit || 0);
        });

        sales.forEach(s => {
            s.payments.forEach((p: any) => {
                if (p.method === 'Dinheiro') mix.cash += p.amount;
                if (p.method === 'PIX') mix.pix += p.amount;
                if (p.method === 'Débito') mix.debit += p.amount;
                if (p.method === 'Crédito') mix.credit += p.amount;
            });
        });

        return { grossRevenue, paidExpenses, pendingExpenses, netBalance, mix };
    }, [sales, expenses, historicalCash]);

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercent = (val: number, total: number) => total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0.0%';

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Topo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DRECard 
                    label="Faturamento Bruto" 
                    value={totals.grossRevenue} 
                    icon={TrendingUp} 
                    color="text-theme-primary" 
                    bgColor="bg-theme-primary/10" 
                />
                <DRECard 
                    label="Despesas Pagas" 
                    value={totals.paidExpenses} 
                    icon={CheckCircleIcon} 
                    color="text-red-500" 
                    bgColor="bg-red-50" 
                />
                <DRECard 
                    label="Contas Pendentes" 
                    value={totals.pendingExpenses} 
                    icon={ClockIcon} 
                    color="text-theme-secondary" 
                    bgColor="bg-theme-secondary/10" 
                />
                <DRECard 
                    label="Saldo Líquido" 
                    value={totals.netBalance} 
                    icon={DollarSign} 
                    color="text-theme-darkblue" 
                    bgColor="bg-theme-darkblue/10" 
                    isMain
                />
            </div>

            {/* Card de Origem Detalhada (Inspirado na imagem) */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Recursos por Modalidade</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Origem detalhada de cada Real que entrou no caixa</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-xl border dark:border-gray-700">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Bruto</span>
                        <span className="text-lg font-black text-gray-800 dark:text-gray-100">{formatCurrency(totals.grossRevenue)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <ParticipationBar 
                        label="Dinheiro em Espécie" 
                        value={totals.mix.cash} 
                        total={totals.grossRevenue} 
                        color="bg-theme-primary" 
                        icon={Wallet} 
                    />
                    <ParticipationBar 
                        label="Recebimentos via PIX" 
                        value={totals.mix.pix} 
                        total={totals.grossRevenue} 
                        color="bg-theme-green" 
                        icon={Smartphone} 
                    />
                    <ParticipationBar 
                        label="Cartão de Débito" 
                        value={totals.mix.debit} 
                        total={totals.grossRevenue} 
                        color="bg-blue-600" 
                        icon={CreditCard} 
                    />
                    <ParticipationBar 
                        label="Vendas no Crédito" 
                        value={totals.mix.credit} 
                        total={totals.grossRevenue} 
                        color="bg-purple-600" 
                        icon={LandmarkIcon} 
                    />
                </div>
            </div>

            {/* Resumo Analítico Adicional */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Performance Financeira</h4>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Entradas', value: totals.grossRevenue, color: '#00843D' },
                                { name: 'Saídas', value: totals.paidExpenses, color: '#ef4444' },
                                { name: 'Saldo', value: totals.netBalance, color: '#1E3A63' },
                            ]}>
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    { [0,1,2].map((_, i) => <Cell key={i} fill={i === 0 ? '#00843D' : i === 1 ? '#ef4444' : '#1E3A63'} />) }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="bg-theme-darkblue p-6 rounded-3xl shadow-xl text-white flex flex-col justify-between">
                    <div>
                        <div className="p-3 bg-white/10 rounded-2xl w-fit mb-4">
                            <LayoutDashboard size={24} />
                        </div>
                        <h4 className="text-lg font-black uppercase tracking-tight">Performance Líquida</h4>
                        <p className="text-[10px] font-bold text-white/60 uppercase mt-1">Margem Real de Operação</p>
                    </div>
                    
                    <div className="py-6">
                        <span className="text-4xl font-black">{((totals.netBalance / totals.grossRevenue) * 100 || 0).toFixed(1)}%</span>
                        <p className="text-[10px] font-black uppercase mt-1 opacity-80">De cada R$ 1,00 vendido, este é o lucro que fica na empresa após as despesas.</p>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center text-xs font-bold uppercase">
                            <span>Eficiência de Caixa</span>
                            <span className="bg-theme-green px-2 py-0.5 rounded-full text-[10px] text-white">Excelente</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Subcomponentes de UI ---

const DRECard: React.FC<{ label: string, value: number, icon: any, color: string, bgColor: string, isMain?: boolean }> = ({ label, value, icon: Icon, color, bgColor, isMain }) => (
    <div className={`p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:scale-[1.02] ${isMain ? 'bg-theme-primary text-white border-none' : 'bg-white dark:bg-gray-800'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${isMain ? 'bg-white/20' : bgColor}`}>
                <Icon size={20} className={isMain ? 'text-white' : color} />
            </div>
            {value >= 0 ? <ArrowUpRight size={14} className={isMain ? 'text-white' : 'text-green-500'} /> : <ArrowDownRight size={14} className="text-red-500" />}
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isMain ? 'text-white/70' : 'text-gray-400'}`}>{label}</p>
        <p className={`text-xl font-black mt-1 ${isMain ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
            {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
    </div>
);

const ParticipationBar: React.FC<{ label: string, value: number, total: number, color: string, icon: any }> = ({ label, value, total, color, icon: Icon }) => {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-500">
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                    <p className="text-sm font-black text-gray-800 dark:text-gray-100 leading-none">
                        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </div>
            
            <div className="relative pt-1">
                <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-gray-100 dark:bg-gray-700">
                    <div 
                        style={{ width: `${percent}%` }}
                        className={`shadow-none flex flex-col text-center white-space-nowrap text-white justify-center ${color} transition-all duration-1000`}
                    ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] font-black text-gray-400 uppercase">Participação</span>
                    <span className={`text-[10px] font-black ${percent > 0 ? 'text-theme-primary' : 'text-gray-400'}`}>{percent.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
};

const CheckCircleIcon = (props: any) => <CheckCircle size={20} {...props} />;
const ClockIcon = (props: any) => <Clock size={20} {...props} />;
const LandmarkIcon = (props: any) => <Landmark size={20} {...props} />;

import { CheckCircle, Clock, Landmark } from 'lucide-react';

export default DREDashboard;
