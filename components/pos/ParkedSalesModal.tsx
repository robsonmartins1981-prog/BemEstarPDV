
import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { ParkedSale } from '../../types';
import { OrderType } from '../../types';
import { Store, Truck, MapPin, Phone } from 'lucide-react';

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
        <Modal isOpen={isOpen} onClose={onClose} title="Recuperar Pedidos / Encomendas">
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {parkedSales.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">Nenhum pedido salvo encontrado.</p>
                ) : (
                    parkedSales.map(sale => (
                        <div key={sale.id} className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-theme-primary transition-all group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${sale.type === OrderType.ENTREGA ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                    {sale.type === OrderType.ENTREGA ? <Truck size={20} /> : <Store size={20} />}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{sale.customerName}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{sale.type} • {formatDateTime(sale.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-theme-primary">{formatCurrency(sale.total)}</p>
                                  <p className="text-xs text-gray-500">{sale.items.length} item(ns)</p>
                                </div>
                            </div>

                            {sale.type === OrderType.ENTREGA && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg text-xs">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <MapPin size={14} className="shrink-0 text-theme-primary" />
                                  <span className="truncate">{sale.deliveryAddress}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Phone size={14} className="shrink-0 text-theme-primary" />
                                  <span>{sale.contactPhone}</span>
                                </div>
                              </div>
                            )}

                            {sale.notes && (
                              <p className="text-xs italic text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 p-2 rounded">
                                " {sale.notes} "
                              </p>
                            )}

                            <div className="flex justify-end pt-1">
                                <Button variant="primary" className="w-full md:w-auto" onClick={() => onLoadSale(sale)}>
                                    Carregar Pedido
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
