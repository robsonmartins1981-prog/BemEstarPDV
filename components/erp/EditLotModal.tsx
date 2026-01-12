
import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { InventoryLot, Product } from '../../types';
import { Calendar, Boxes, Save, Hash } from 'lucide-react';

interface EditLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: InventoryLot | null;
  onSave: () => void;
}

const EditLotModal: React.FC<EditLotModalProps> = ({ isOpen, onClose, lot, onSave }) => {
    const [formData, setFormData] = useState<Partial<InventoryLot>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (lot) {
            setFormData({
                ...lot,
                expirationDate: lot.expirationDate ? new Date(lot.expirationDate) : undefined
            });
        }
    }, [lot]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            expirationDate: value ? new Date(value + 'T12:00:00') : undefined
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lot || !formData.id) return;

        setIsSaving(true);
        try {
            const tx = db.transaction(['inventoryLots', 'products'], 'readwrite');
            const lotStore = tx.objectStore('inventoryLots');
            const productStore = tx.objectStore('products');

            // 1. Atualiza o lote
            await lotStore.put(formData as InventoryLot);

            // 2. Recalcula o estoque total do produto para manter a integridade
            const allLots = await lotStore.index('productId').getAll(lot.productId);
            // Substituímos o lote que acabamos de editar no array para o cálculo
            const updatedLots = allLots.map(l => l.id === formData.id ? (formData as InventoryLot) : l);
            const newTotalStock = updatedLots.reduce((acc, curr) => acc + curr.quantity, 0);

            const product = await productStore.get(lot.productId);
            if (product) {
                product.stock = newTotalStock;
                await productStore.put(product);
            }

            await tx.done;
            onSave();
            onClose();
        } catch (error) {
            console.error("Erro ao atualizar lote:", error);
            alert("Erro ao salvar as alterações do lote.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatDateForInput = (date?: Date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Lote e Validade">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-4 bg-theme-primary/5 rounded-2xl border border-theme-primary/10 mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Interno do Lote</p>
                    <p className="font-mono text-xs text-theme-primary truncate">{lot?.id}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Identificação / Doc</label>
                        <div className="relative">
                            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="id"
                                value={formData.id || ''}
                                disabled
                                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold opacity-70 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Data de Validade</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={formatDateForInput(formData.expirationDate)}
                                onChange={handleDateChange}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-2 focus:ring-theme-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Quantidade em Estoque</label>
                        <div className="relative">
                            <Boxes size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                name="quantity"
                                step="0.001"
                                value={formData.quantity || 0}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-lg font-black focus:ring-2 focus:ring-theme-primary outline-none font-mono text-theme-primary"
                            />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 ml-1">* Alterar a quantidade aqui atualizará automaticamente o estoque global do produto.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>
                        <Save size={16} className="mr-2"/>
                        {isSaving ? 'Salvando...' : 'Confirmar Alterações'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditLotModal;
