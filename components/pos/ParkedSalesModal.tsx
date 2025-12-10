import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { ParkedSale } from '../../types';

interface ParkedSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSale: (sale: ParkedSale) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDateTime = (date: Date) => date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const ParkedSalesModal: React.FC<ParkedSalesModalProps> = ({ isOpen, onClose, onLoadSale }) => {
    const [parkedSales, setParkedSales] = useState<ParkedSale[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchSales = async () => {
                const sales = await db.getAllFromIndex('parkedSales', 'createdAt');
                setParkedSales(sales.reverse()); // Show newest first
            };
            fetchSales();
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Recuperar Pedido Salvo">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {parkedSales.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">Nenhum pedido salvo encontrado.</p>
                ) : (
                    parkedSales.map(sale => (
                        <div key={sale.id} className="grid grid-cols-4 gap-4 items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div>
                                <p className="font-semibold text-sm">{sale.customerName || 'Cliente não identificado'}</p>
                                <p className="text-xs text-gray-500">Salvo em: {formatDateTime(sale.createdAt)}</p>
                            </div>
                            <div className="text-sm">
                                {sale.items.length} item(ns)
                            </div>
                            <div className="font-bold text-right">
                                {formatCurrency(sale.total)}
                            </div>
                            <div className="text-right">
                                <Button variant="primary" onClick={() => onLoadSale(sale)}>
                                    Carregar
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

export default ParkedSalesModal;
