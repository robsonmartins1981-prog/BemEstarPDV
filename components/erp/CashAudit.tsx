
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { HistoricalCashEntry } from '../../types';
import Button from '../shared/Button';
import { Upload, Download, FileSpreadsheet, Filter, Wallet, Smartphone, CreditCard, MinusCircle, PlusCircle, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const CashAudit: React.FC = () => {
    const [entries, setEntries] = useState<HistoricalCashEntry[]>([]);
    const [selectedTerminal, setSelectedTerminal] = useState<string>('ALL');
    const [isImporting, setIsImporting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const fetchEntries = useCallback(async () => {
        const all = await db.getAll('historicalCash');
        // Ordena por data decrescente
        setEntries(all.sort((a, b) => b.date.getTime() - a.date.getTime()));
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            // O CSV usa ; como separador e . para decimais no exemplo do usuário
            const rows = text.split('\n');
            const newEntries: HistoricalCashEntry[] = [];

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].trim();
                if (!row) continue;

                const cols = row.split(';');
                if (cols.length < 7) continue;

                const [dateStr, terminal, dinero, pix, cred, deb, sangria] = cols;

                const cash = parseFloat(dinero) || 0;
                const pixVal = parseFloat(pix) || 0;
                const credit = parseFloat(cred) || 0;
                const debit = parseFloat(deb) || 0;
                const withdrawal = parseFloat(sangria) || 0;

                const gross = cash + pixVal + credit + debit;
                const net = gross - withdrawal;

                newEntries.push({
                    id: uuidv4(),
                    date: new Date(dateStr + 'T12:00:00'),
                    terminal: terminal.toUpperCase(),
                    cash,
                    pix: pixVal,
                    credit,
                    debit,
                    withdrawal,
                    totalGross: gross,
                    totalNet: net
                });
            }

            if (newEntries.length > 0) {
                const tx = db.transaction('historicalCash', 'readwrite');
                for (const entry of newEntries) {
                    await tx.store.put(entry);
                }
                await tx.done;
                setSuccessMsg(`${newEntries.length} registros importados com sucesso!`);
                fetchEntries();
                setTimeout(() => setSuccessMsg(''), 5000);
            }
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    const filteredEntries = useMemo(() => {
        if (selectedTerminal === 'ALL') return entries;
        return entries.filter(e => e.terminal === selectedTerminal);
    }, [entries, selectedTerminal]);

    const stats = useMemo(() => {
        return filteredEntries.reduce((acc, curr) => ({
            cash: acc.cash + curr.cash,
            pix: acc.pix + curr.pix,
            credit: acc.credit + curr.credit,
            debit: acc.debit + curr.debit,
            withdrawal: acc.withdrawal + curr.withdrawal,
            net: acc.net + curr.totalNet
        }), { cash: 0, pix: 0, credit: 0, debit: 0, withdrawal: 0, net: 0 });
    }, [filteredEntries]);

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Fechamentos Históricos</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Auditoria de Terminais (01, 02 e 03)</p>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                    <label className="flex-1 lg:flex-none">
                        <div className="cursor-pointer bg-theme-primary text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-theme-primary-hover transition-all">
                            <Upload size={16} /> {isImporting ? 'Processando...' : 'Importar CSV'}
                        </div>
                        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={20} />
                    <span className="font-bold text-sm uppercase tracking-tight">{successMsg}</span>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Dinheiro" value={stats.cash} icon={Wallet} color="text-theme-secondary" />
                <StatCard label="PIX" value={stats.pix} icon={Smartphone} color="text-green-500" />
                <StatCard label="Crédito" value={stats.credit} icon={CreditCard} color="text-blue-500" />
                <StatCard label="Débito" value={stats.debit} icon={CreditCard} color="text-purple-500" />
                <StatCard label="Sangrias" value={stats.withdrawal} icon={MinusCircle} color="text-red-500" />
                <StatCard label="Saldo Líquido" value={stats.net} icon={PlusCircle} color="text-theme-primary" highlight />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex gap-2">
                        {['ALL', 'CAIXA 01 (MANHÃ)', 'CAIXA 02 (TARDE)', 'CAIXA 03 (NOITE)'].map(t => (
                            <button
                                key={t}
                                onClick={() => setSelectedTerminal(t)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedTerminal === t ? 'bg-theme-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-theme-primary'}`}
                            >
                                {t === 'ALL' ? 'Todos' : t.split(' ')[1]}
                            </button>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase">{filteredEntries.length} Registros</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/80 text-[10px] uppercase font-black text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Terminal</th>
                                <th className="px-6 py-4 text-right">Dinheiro</th>
                                <th className="px-6 py-4 text-right">PIX</th>
                                <th className="px-6 py-4 text-right">Cartões</th>
                                <th className="px-6 py-4 text-right text-red-500">Sangria</th>
                                <th className="px-6 py-4 text-right text-theme-primary">Líquido</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredEntries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-600 dark:text-gray-300">
                                        {entry.date.toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-gray-500">
                                            {entry.terminal}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold">{formatCurrency(entry.cash)}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-green-600">{formatCurrency(entry.pix)}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">
                                        {formatCurrency(entry.credit + entry.debit)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-red-500">
                                        -{formatCurrency(entry.withdrawal)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-mono font-black text-theme-primary text-base">
                                            {formatCurrency(entry.totalNet)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredEntries.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center gap-4 text-gray-400">
                            <FileSpreadsheet size={48} className="opacity-10" />
                            <p className="font-bold uppercase text-xs tracking-widest">Nenhum dado importado para este terminal</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string, value: number, icon: React.ElementType, color: string, highlight?: boolean }> = ({ label, value, icon: Icon, color, highlight }) => (
    <div className={`p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border ${highlight ? 'border-theme-primary bg-theme-primary/5' : 'border-gray-100 dark:border-gray-700'}`}>
        <div className="flex items-center gap-2 mb-2">
            <Icon size={14} className={color} />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        <p className={`text-sm lg:text-lg font-black font-mono ${highlight ? 'text-theme-primary' : 'text-gray-800 dark:text-gray-100'}`}>
            {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
    </div>
);

export default CashAudit;
