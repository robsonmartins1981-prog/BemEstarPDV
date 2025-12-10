import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Product, InventoryLot, InventoryAdjustment } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import AdjustmentHistoryModal from './AdjustmentHistoryModal'; // Importa o novo modal
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- COMPONENTE DE AJUSTE DE ESTOQUE ---
const AdjustmentForm: React.FC<{ lot: InventoryLot; product: Product; onSave: () => void; onCancel: () => void }> = ({ lot, product, onSave, onCancel }) => {
    const [type, setType] = useState<'IN' | 'OUT'>('OUT');
    const [quantity, setQuantity] = useState<number>(1);
    const [reason, setReason] = useState('');

    const handleSubmit = async () => {
        if (!reason || quantity <= 0) {
            alert("Preencha a quantidade e o motivo.");
            return;
        }

        const tx = db.transaction(['inventoryLots', 'inventoryAdjustments', 'products'], 'readwrite');
        const lotsStore = tx.objectStore('inventoryLots');
        const adjustmentsStore = tx.objectStore('inventoryAdjustments');
        const productsStore = tx.objectStore('products');

        const quantityChange = type === 'IN' ? quantity : -quantity;
        
        // Atualiza o lote
        const lotToUpdate = await lotsStore.get(lot.id);
        if (lotToUpdate) {
            lotToUpdate.quantity += quantityChange;
            await lotsStore.put(lotToUpdate);
        }

        // Atualiza o produto
        const productToUpdate = await productsStore.get(product.id);
        if(productToUpdate) {
            productToUpdate.stock += quantityChange;
            await productsStore.put(productToUpdate);
        }

        // Registra o ajuste
        const adjustment: InventoryAdjustment = {
            id: uuidv4(),
            productId: product.id,
            lotId: lot.id,
            quantityChange,
            reason,
            date: new Date()
        };
        await adjustmentsStore.add(adjustment);
        
        await tx.done;
        onSave();
    };

    return (
        <div className="space-y-4">
            <p><strong>Produto:</strong> {product.name}</p>
            <p className="text-sm"><strong>Lote Atual:</strong> {lot.quantity} un. | <strong>Validade:</strong> {lot.expirationDate?.toLocaleDateString('pt-BR') || 'N/A'}</p>
             <div className="flex gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                 <button onClick={() => setType('OUT')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${type === 'OUT' ? 'bg-red-500 text-white shadow' : ''}`}>Saída Manual</button>
                 <button onClick={() => setType('IN')} className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${type === 'IN' ? 'bg-green-500 text-white shadow' : ''}`}>Entrada Manual</button>
            </div>
            <div>
                <label>Quantidade a ajustar</label>
                <input type="number" value={quantity} onChange={e => setQuantity(Math.max(0, parseInt(e.target.value)))} className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label>Motivo do ajuste</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Perda por avaria, Acerto de contagem..." className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
            </div>
             <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="button" variant="primary" onClick={handleSubmit}>Confirmar Ajuste</Button>
            </div>
        </div>
    );
}

// --- COMPONENTE PRINCIPAL DO RELATÓRIO ---
const InventoryReport: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [lots, setLots] = useState<InventoryLot[]>([]);
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
    const [adjustingLot, setAdjustingLot] = useState<{lot: InventoryLot, product: Product} | null>(null);
    const [historyProductId, setHistoryProductId] = useState<string | null>(null); // Estado para o modal de histórico

    const fetchData = useCallback(async () => {
        const [allProducts, allLots] = await Promise.all([
            db.getAll('products'),
            db.getAll('inventoryLots')
        ]);
        setProducts(allProducts);
        setLots(allLots);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const productLots = useMemo(() => {
        const map = new Map<string, InventoryLot[]>();
        lots.forEach(lot => {
            const productLots = map.get(lot.productId) || [];
            productLots.push(lot);
            map.set(lot.productId, productLots);
        });
        return map;
    }, [lots]);

    const toggleProductExpansion = (productId: string) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleShowHistory = (productId: string) => {
        setHistoryProductId(productId);
    };
    
    const getLotStatus = (lot: InventoryLot) => {
        if (!lot.expirationDate) return { colorClass: '', label: '', highlightClass: '' };
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normaliza para o início do dia
        const expiration = new Date(lot.expirationDate);
        expiration.setHours(0, 0, 0, 0);

        const diffTime = expiration.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { 
            colorClass: 'bg-red-500', 
            label: `Vencido há ${Math.abs(diffDays)} dia(s)`,
            highlightClass: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' 
        };
        if (diffDays <= 30) return { 
            colorClass: 'bg-yellow-500', 
            label: `Vence em ${diffDays} dia(s)`,
            highlightClass: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
        };
        return { colorClass: '', label: '', highlightClass: '' };
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Relatório de Inventário e Validade</h2>
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-6 py-3">Produto</th>
                            <th className="px-6 py-3 text-right">Estoque Total</th>
                            <th className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                       {products.map(product => (
                            <React.Fragment key={product.id}>
                                <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                    <td className="px-4 py-3 text-center cursor-pointer" onClick={() => toggleProductExpansion(product.id)}>
                                        {expandedProducts.has(product.id) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    </td>
                                    <td className="px-6 py-3 font-medium cursor-pointer" onClick={() => toggleProductExpansion(product.id)}>{product.name}</td>
                                    <td className="px-6 py-3 text-right font-mono font-bold text-lg cursor-pointer" onClick={() => toggleProductExpansion(product.id)}>{product.stock} {product.isBulk ? 'kg' : 'un'}</td>
                                    <td className="px-6 py-3 text-center">
                                        <Button 
                                            variant="secondary" 
                                            className="text-xs py-1 px-2 h-auto" 
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evita que o clique expanda/recolha a linha
                                                handleShowHistory(product.id);
                                            }}
                                        >
                                            <History size={14} className="mr-1"/> Histórico
                                        </Button>
                                    </td>
                                </tr>
                                {expandedProducts.has(product.id) && (
                                    <tr>
                                        <td colSpan={4} className="p-0">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                                                <h4 className="font-semibold px-2 mb-2">Lotes</h4>
                                                {productLots.get(product.id)?.sort((a,b) => (a.expirationDate?.getTime() || 0) - (b.expirationDate?.getTime() || 0)).map(lot => {
                                                    const status = getLotStatus(lot);
                                                    return (
                                                        <div key={lot.id} className={`grid grid-cols-5 gap-4 items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600/50 ${status.highlightClass}`}>
                                                            <div>
                                                                <span className="text-xs text-gray-500">Qtd: </span>
                                                                <span className="font-mono">{lot.quantity}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-gray-500">Custo: </span>
                                                                <span className="font-mono">{lot.costPrice.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-gray-500">Entrada: </span>
                                                                <span>{new Date(lot.entryDate).toLocaleDateString('pt-BR')}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-gray-500">Validade: </span>
                                                                <span>{lot.expirationDate?.toLocaleDateString('pt-BR') || 'N/A'}</span>
                                                                {status.colorClass && <span className={`w-3 h-3 rounded-full ${status.colorClass}`} title={status.label}></span>}
                                                            </div>
                                                             <div className="text-right">
                                                                <Button variant="secondary" className="text-xs py-1 px-2 h-auto" onClick={() => setAdjustingLot({lot, product})}>Ajustar</Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {(!productLots.get(product.id) || productLots.get(product.id)?.length === 0) && <p className="text-xs text-center text-gray-500 p-2">Nenhum lote encontrado para este produto.</p>}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                       ))}
                    </tbody>
                 </table>
            </div>
            
            {adjustingLot && (
                <Modal isOpen={!!adjustingLot} onClose={() => setAdjustingLot(null)} title="Ajuste Manual de Estoque">
                    <AdjustmentForm lot={adjustingLot.lot} product={adjustingLot.product} onSave={() => { setAdjustingLot(null); fetchData(); }} onCancel={() => setAdjustingLot(null)}/>
                </Modal>
            )}

            {historyProductId && (
                <AdjustmentHistoryModal 
                    isOpen={!!historyProductId}
                    onClose={() => setHistoryProductId(null)}
                    productId={historyProductId}
                />
            )}
        </div>
    );
};

export default InventoryReport;
