
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

const ValidityAlertBanner: React.FC<{ onAction: () => void }> = ({ onAction }) => {
    const [criticalCount, setCriticalCount] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const checkValidades = async () => {
            const lots = await db.getAll('inventoryLots');
            const today = new Date(); today.setHours(0,0,0,0);
            
            const count = lots.filter(lot => {
                if (!lot.expirationDate) return false;
                const exp = new Date(lot.expirationDate);
                const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 7; // Vencidos ou vencendo em 7 dias
            }).length;

            if (count > 0) {
                setCriticalCount(count);
                setVisible(true);
            }
        };
        checkValidades();
    }, []);

    if (!visible) return null;

    return (
        <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between mb-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-full">
                    <AlertTriangle size={24} className="animate-pulse" />
                </div>
                <div>
                    <h3 className="font-black uppercase text-sm tracking-tight">Alerta de Validade Crítica</h3>
                    <p className="text-xs text-red-100 font-bold uppercase">Existem {criticalCount} lotes de produtos vencidos ou próximos do vencimento!</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onAction}
                    className="bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-gray-100 transition-colors"
                >
                    Ver Detalhes <ArrowRight size={14} />
                </button>
                <button onClick={() => setVisible(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default ValidityAlertBanner;
