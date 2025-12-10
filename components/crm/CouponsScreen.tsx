import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Coupon } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';

interface CouponsScreenProps {
    onNewCoupon: () => void;
    onEditCoupon: (couponId: string) => void;
}

const CouponsScreen: React.FC<CouponsScreenProps> = ({ onNewCoupon, onEditCoupon }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);

    const fetchCoupons = useCallback(async () => {
        const allCoupons = await db.getAll('coupons');
        setCoupons(allCoupons.sort((a, b) => a.code.localeCompare(b.code)));
    }, []);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.')) {
            await db.delete('coupons', id);
            fetchCoupons();
        }
    };
    
    const handleToggleActive = async (coupon: Coupon) => {
        const updatedCoupon = { ...coupon, isActive: coupon.isActive === 1 ? 0 : 1 };
        await db.put('coupons', updatedCoupon);
        fetchCoupons();
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <Button onClick={onNewCoupon}>
                    <PlusCircle size={18}/> Novo Cupom
                </Button>
            </div>
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Código</th>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                            <th className="px-6 py-3 text-center">Usos</th>
                            <th className="px-6 py-3">Validade</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map(coupon => {
                            const isExpired = new Date() > new Date(coupon.expiryDate);
                            const hasReachedLimit = coupon.currentUses >= coupon.maxUses;
                            const effectiveStatus = coupon.isActive === 1 && !isExpired && !hasReachedLimit;
                            return (
                                <tr key={coupon.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                    <td className="px-6 py-3 font-medium font-mono">{coupon.code}</td>
                                    <td className="px-6 py-3">{coupon.type === 'PERCENTAGE' ? 'Percentual' : 'Valor Fixo'}</td>
                                    <td className="px-6 py-3 text-right font-mono">{coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : coupon.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                                    <td className="px-6 py-3 text-center">{coupon.currentUses} / {coupon.maxUses}</td>
                                    <td className={`px-6 py-3 ${isExpired ? 'text-red-500' : ''}`}>{new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium ${effectiveStatus ? 'bg-green-100 text-green-800 dark:bg-green-900/50' : 'bg-red-100 text-red-800 dark:bg-red-900/50'}`}>
                                            {effectiveStatus ? <Check size={14}/> : <X size={14}/>}
                                            {effectiveStatus ? 'Válido' : 'Inválido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleToggleActive(coupon)} title={coupon.isActive ? 'Desativar' : 'Ativar'} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
                                                {coupon.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                                            </button>
                                            <Button variant="secondary" size="sm" className="p-2 h-auto" onClick={() => onEditCoupon(coupon.id)}><Edit size={16}/></Button>
                                            <Button variant="danger" size="sm" className="p-2 h-auto" onClick={() => handleDelete(coupon.id)}><Trash2 size={16}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {coupons.length === 0 && <div className="text-center p-8 text-gray-500">Nenhum cupom cadastrado.</div>}
            </div>
        </div>
    );
};

export default CouponsScreen;
