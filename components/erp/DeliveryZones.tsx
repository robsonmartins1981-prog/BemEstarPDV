
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { DeliveryZone } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, MapPin, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const DeliveryZones: React.FC = () => {
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [editingZone, setEditingZone] = useState<Partial<DeliveryZone> | null>(null);

    const fetchZones = useCallback(async () => {
        const allZones = await db.getAll('deliveryZones');
        setZones(allZones.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood)));
    }, []);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingZone?.neighborhood || editingZone.fee === undefined) return;

        const zoneData: DeliveryZone = {
            id: editingZone.id || uuidv4(),
            neighborhood: editingZone.neighborhood.toUpperCase(),
            fee: editingZone.fee
        };

        await db.put('deliveryZones', zoneData);
        setEditingZone(null);
        fetchZones();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Deseja realmente excluir esta taxa de frete?')) {
            await db.delete('deliveryZones', id);
            fetchZones();
        }
    };

    const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Taxas de Entrega</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Gerencie valores de frete por bairro</p>
                    </div>
                    {!editingZone && (
                        <Button onClick={() => setEditingZone({ neighborhood: '', fee: 0 })}>
                            <PlusCircle size={18}/> Novo Bairro
                        </Button>
                    )}
                </div>

                {editingZone && (
                    <form onSubmit={handleSave} className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-theme-primary/30 animate-in fade-in zoom-in-95">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nome do Bairro</label>
                                <input 
                                    type="text" 
                                    value={editingZone.neighborhood}
                                    onChange={e => setEditingZone({...editingZone, neighborhood: e.target.value})}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Valor do Frete (R$)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    value={editingZone.fee}
                                    onChange={e => setEditingZone({...editingZone, fee: parseFloat(e.target.value)})}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 font-mono"
                                    required
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="submit" variant="primary" className="flex-1">Salvar</Button>
                                <Button type="button" variant="secondary" onClick={() => setEditingZone(null)}>Cancelar</Button>
                            </div>
                        </div>
                    </form>
                )}

                <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/80 text-[10px] uppercase font-black text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Bairro / Região</th>
                                <th className="px-6 py-4 text-right">Taxa de Frete</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {zones.map(zone => (
                                <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200 uppercase flex items-center gap-2">
                                        <MapPin size={14} className="text-theme-primary" />
                                        {zone.neighborhood}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-theme-primary">
                                        {formatCurrency(zone.fee)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button variant="secondary" className="!p-2 h-auto" onClick={() => setEditingZone(zone)}>
                                                <Edit size={14}/>
                                            </Button>
                                            <Button variant="danger" className="!p-2 h-auto" onClick={() => handleDelete(zone.id)}>
                                                <Trash2 size={14}/>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {zones.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                                        Nenhum bairro cadastrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DeliveryZones;
