import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Coupon } from '../../types';
import Button from '../shared/Button';
import { Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CouponFormPageProps {
  couponId?: string;
  onBack: () => void;
}

const CouponFormPage: React.FC<CouponFormPageProps> = ({ couponId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Coupon>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (couponId) {
                const coupon = await db.get('coupons', couponId);
                if (coupon) setFormData(coupon);
                else onBack();
            } else {
                setFormData({
                    id: uuidv4(),
                    code: '',
                    type: 'PERCENTAGE',
                    value: 10,
                    expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                    maxUses: 100,
                    currentUses: 0,
                    isActive: 1,
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [couponId, onBack]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
        } else if (type === 'date') {
            setFormData(prev => ({ ...prev, [name]: new Date(value + 'T00:00:00') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        if (!dataToSave.code || !dataToSave.expiryDate) {
            alert('Código e Data de Validade são obrigatórios.');
            return;
        }
        dataToSave.code = dataToSave.code.toUpperCase().trim();

        try {
            await db.put('coupons', dataToSave as Coupon);
            onBack();
        } catch (error) {
            console.error("Erro ao salvar cupom:", error);
            alert("Erro ao salvar. Verifique se o código do cupom já existe.");
        }
    };
    
    if (isLoading) {
        return <div className="text-center p-8">Carregando dados do cupom...</div>;
    }

    const inputStyle = "mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-theme-primary focus:ring-theme-primary";
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Código do Cupom</label>
                        <input type="text" name="code" value={formData.code?.toUpperCase()} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Desconto</label>
                        <select name="type" value={formData.type} onChange={handleChange} className={inputStyle + " font-bold"}>
                            <option value="PERCENTAGE">%</option>
                            <option value="FIXED_AMOUNT">$</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Valor</label>
                        <input type="number" name="value" value={formData.value} onChange={handleChange} required className={inputStyle} min="0" step="0.01" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Data de Validade</label>
                        <input type="date" name="expiryDate" value={(formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : '')} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Limite de Usos</label>
                        <input type="number" name="maxUses" value={formData.maxUses} onChange={handleChange} required className={inputStyle} min="0" />
                    </div>
                    <div className="flex items-center pt-6">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive === 1} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-theme-primary focus:ring-theme-primary"/>
                        <label htmlFor="isActive" className="ml-2 block text-sm font-medium">Cupom Ativo</label>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary"><Save size={16} className="mr-2"/> Salvar Cupom</Button>
                </div>
            </form>
        </div>
    );
};

export default CouponFormPage;
