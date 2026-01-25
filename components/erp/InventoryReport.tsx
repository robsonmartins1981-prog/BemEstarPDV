
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Product, InventoryLot } from '../../types';
import Button from '../shared/Button';
import AdjustmentHistoryModal from './AdjustmentHistoryModal';
import EditLotModal from './EditLotModal';
import { ChevronDown, ChevronUp, History, Calendar, AlertTriangle, Search, Pencil, Filter } from 'lucide-react';

type ValidityPeriod = 'ALL' | 'EXPIRED' | '7DAYS' | '15DAYS' | '30DAYS' | '60DAYS' | '90DAYS' | '180DAYS';

const InventoryReport: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [lots, setLots] = useState<InventoryLot[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [validityFilter, setValidityFilter] = useState<ValidityPeriod>('ALL');
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
    const [historyProductId, setHistoryProductId] = useState<string | null>(null);
    const [editingLot, setEditingLot] = useState<InventoryLot | null>(null);

    const fetchData = useCallback(async () => {
        const [allProducts, allLots] = await Promise.all([
            db.getAll('products'),
            db.getAll('inventoryLots')
        ]);
        setProducts(allProducts);
        setLots(allLots);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const getLotStatus = (lot: InventoryLot) => {
        if (!lot.expirationDate) return { type: 'OK', label: 'Sem validade' };
        const today = new Date(); today.setHours(0,0,0,0);
        const exp = new Date(lot.expirationDate); exp.setHours(0,0,0,0);
        const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diff < 0) return { type: 'EXPIRED', label: `Vencido há ${Math.abs(diff)} dias`, color: 'text-red-600 bg-red-50 border-red-200' };
        if (diff <= 7) return { type: 'CRITICAL', label: `Vence em ${diff} dias!`, color: 'text-orange-600 bg-orange-50 border-orange-200' };
        if (diff <= 30) return { type: 'WARNING', label: `Vence em ${diff} dias`, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
        return { type: 'OK', label: `Vencimento: ${exp.toLocaleDateString('pt-BR')}`, color: 'bg-white dark:bg-gray-800 border-gray-100' };
    };

    const filteredData = useMemo(() => {
        const today = new Date(); today.setHours(0,0,0,0);
        
        const daysMap: Record<ValidityPeriod, number | null> = {
            'ALL': null,
            'EXPIRED': -1,
            '7DAYS': 7,
            '15DAYS': 15,
            '30DAYS': 30,
            '60DAYS': 60,
            '90DAYS': 90,
            '180DAYS': 180
        };

        const maxDays = daysMap[validityFilter];

        const matchingLots = lots.filter(lot => {
            if (validityFilter === 'ALL') return true;
            if (!lot.expirationDate) return false;
            const exp = new Date(lot.expirationDate); exp.setHours(0,0,0,0);
            const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            
            if (validityFilter === 'EXPIRED') return diff < 0;
            if (maxDays !== null) return diff >= 0 && diff <= maxDays;
            return true;
        });

        const productIdsWithMatchingLots = new Set(matchingLots.map(l => l.productId));

        return products.filter(p => {
            const matchesSearch = 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.id.includes(searchTerm) ||
                (p.barcode && p.barcode.includes(searchTerm));
            
            const matchesValidity = productIdsWithMatchingLots.has(p.id) || (validityFilter === 'ALL');
            return matchesSearch && matchesValidity;
        });
    }, [products, lots, searchTerm, validityFilter]);

    const productLotsMap = useMemo(() => {
        const map = new Map<string, InventoryLot[]>();
        lots.forEach(lot => {
            const list = map.get(lot.productId) || [];
            list.push(lot);
            map.set(lot.productId, list);
        });
        return map;
    }, [lots]);

    const toggleProduct = (id: string) => {
        setExpandedProducts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const filterOptions = [
        { id: 'ALL', label: 'Todos os Itens' },
        { id: 'EXPIRED', label: 'Já Vencidos' },
        { id: '7DAYS', label: 'Próximos 7 dias' },
        { id: '15DAYS', label: 'Próximos 15 dias' },
        { id: '30DAYS', label: 'Próximo 1 mês' },
        { id: '60DAYS', label: 'Próximos 2 meses' },
        { id: '90DAYS', label: 'Próximos 3 meses' },
        { id: '180DAYS', label: 'Próximos 6 meses' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight flex items-center gap-3">
                            <Calendar className="text-theme-primary" size={28} /> Inteligência de Validade
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">Previsão e Monitoramento de Lotes</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Nome ou código..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full md:w-64 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                        
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select 
                                value={validityFilter} 
                                onChange={e => setValidityFilter(e.target.value as ValidityPeriod)}
                                className="w-full md:w-64 pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-theme-primary outline-none appearance-none font-bold text-xs uppercase tracking-wider cursor-pointer"
                            >
                                {filterOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-2xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/80 text-[10px] uppercase font-black text-gray-400 border-b dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-5 w-12"></th>
                                <th className="px-6 py-5">Produto / Descrição</th>
                                <th className="px-6 py-5 text-right">Saldo Global</th>
                                <th className="px-6 py-5 text-center">Status Crítico</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredData.map(product => {
                                const prodLots = (productLotsMap.get(product.id) || []).sort((a,b) => {
                                    if (!a.expirationDate) return 1;
                                    if (!b.expirationDate) return -1;
                                    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
                                });
                                
                                const hasAlert = prodLots.some(l => {
                                    const s = getLotStatus(l);
                                    return s.type === 'EXPIRED' || s.type === 'CRITICAL';
                                });

                                return (
                                    <React.Fragment key={product.id}>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => toggleProduct(product.id)}>
                                                <div className={`p-1.5 rounded-lg transition-all ${expandedProducts.has(product.id) ? 'bg-theme-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                                                    {expandedProducts.has(product.id) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-black text-gray-700 dark:text-gray-200 uppercase tracking-tight">{product.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{product.brand || 'Marca Própria'}</p>
                                                    {product.barcode && <span className="text-[9px] text-theme-primary font-mono font-bold">#{product.barcode}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-mono font-black text-theme-primary text-lg">
                                                    {product.stock.toFixed(2)}
                                                </span>
                                                <span className="ml-1 text-[10px] font-black text-gray-400 uppercase">{product.isBulk ? 'kg' : 'un'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {hasAlert && <AlertTriangle size={20} className="text-red-500 inline animate-pulse" />}
                                            </td>
                                        </tr>
                                        {expandedProducts.has(product.id) && (
                                            <tr className="bg-gray-50/30 dark:bg-gray-900/40">
                                                <td colSpan={4} className="px-10 py-6">
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center px-2">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rastreamento de Lotes Ativos</p>
                                                            <Button variant="secondary" size="sm" onClick={() => setHistoryProductId(product.id)} className="!text-[9px] !py-1 !px-2 rounded-lg">
                                                                <History size={12} className="mr-1"/> Ver Auditoria
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {prodLots.map(lot => {
                                                                const status = getLotStatus(lot);
                                                                return (
                                                                    <div key={lot.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all shadow-sm ${status.color}`}>
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`p-2 rounded-xl bg-white/50 dark:bg-black/20 ${status.type === 'EXPIRED' ? 'text-red-600' : 'text-gray-500'}`}>
                                                                                <Calendar size={18} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-black uppercase leading-tight">{status.label}</p>
                                                                                <p className="text-[10px] font-bold text-gray-500/80 mt-0.5">Qtd: {lot.quantity.toFixed(3)} | Custo: {lot.costPrice.toLocaleString('pt-BR', {style: 'currency', currency:'BRL'})}</p>
                                                                            </div>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => setEditingLot(lot)}
                                                                            className="p-2 hover:bg-white/50 dark:hover:bg-black/20 rounded-xl transition-colors text-gray-400 hover:text-theme-primary"
                                                                            title="Editar lote/validade"
                                                                        >
                                                                            <Pencil size={14}/>
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {prodLots.length === 0 && (
                                                            <div className="p-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 uppercase text-[10px] font-black">
                                                                Nenhum lote vinculado a este produto
                                                            </div>
                                                        )}
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
                
                {filteredData.length === 0 && (
                    <div className="text-center py-20">
                         <div className="inline-block p-6 bg-gray-100 dark:bg-gray-900 rounded-full mb-4">
                            <Search size={48} className="text-gray-300" />
                         </div>
                         <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhum item encontrado para este período</p>
                    </div>
                )}
            </div>

            {historyProductId && (
                <AdjustmentHistoryModal isOpen={!!historyProductId} onClose={() => setHistoryProductId(null)} productId={historyProductId} />
            )}

            <EditLotModal 
                isOpen={!!editingLot} 
                onClose={() => setEditingLot(null)} 
                lot={editingLot} 
                onSave={fetchData} 
            />
        </div>
    );
};

export default InventoryReport;
