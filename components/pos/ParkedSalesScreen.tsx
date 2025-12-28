
import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { ParkedSale } from '../../types';
import { OrderType } from '../../types';
import { Store, Truck, MapPin, Phone, ShoppingCart, Search, Trash2, ArrowLeft } from 'lucide-react';

interface ParkedSalesScreenProps {
  onBack: () => void;
  onLoadSale: (sale: ParkedSale) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDateTime = (date: Date) => date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const ParkedSalesScreen: React.FC<ParkedSalesScreenProps> = ({ onBack, onLoadSale }) => {
    const [parkedSales, setParkedSales] = useState<ParkedSale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSales = async () => {
        const sales = await db.getAllFromIndex('parkedSales', 'createdAt');
        setParkedSales(sales.reverse());
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleDelete = async (id: string) => {
      if (confirm('Tem certeza que deseja excluir este pedido permanente?')) {
        await db.delete('parkedSales', id);
        fetchSales();
      }
    };

    const filteredSales = parkedSales.filter(s => 
      s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPhone?.includes(searchTerm)
    );

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
            <div className="max-w-6xl mx-auto w-full flex flex-col h-full space-y-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Pedidos e Encomendas</h2>
                    <p className="text-sm text-gray-500">Gerencie vendas em espera, retiradas e entregas.</p>
                  </div>
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por cliente, endereço ou telefone..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                  {filteredSales.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <ShoppingCart size={64} className="opacity-10 mb-4" />
                        <p className="text-lg font-medium">Nenhum pedido encontrado.</p>
                        <Button variant="secondary" className="mt-4" onClick={onBack}>Voltar ao Checkout</Button>
                      </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {filteredSales.map(sale => (
                          <div key={sale.id} className="flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-transparent hover:border-theme-primary transition-all shadow-sm group">
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${sale.type === OrderType.ENTREGA ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}`}>
                                      {sale.type === OrderType.ENTREGA ? <Truck size={24} /> : <Store size={24} />}
                                    </div>
                                    <div>
                                      <p className="font-black text-lg text-gray-800 dark:text-gray-100 leading-tight">{sale.customerName}</p>
                                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{sale.type} • {formatDateTime(sale.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-black text-theme-primary">{formatCurrency(sale.total)}</p>
                                    <p className="text-xs text-gray-500">{sale.items.length} item(ns)</p>
                                  </div>
                              </div>

                              <hr className="border-gray-100 dark:border-gray-700" />

                              <div className="space-y-2">
                                {sale.type === OrderType.ENTREGA && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                                      <MapPin size={16} className="shrink-0 text-theme-primary mt-0.5" />
                                      <span className="leading-tight">{sale.deliveryAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                      <Phone size={16} className="shrink-0 text-theme-primary" />
                                      <span className="font-mono">{sale.contactPhone}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {sale.notes && (
                                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-xs italic text-gray-500 dark:text-gray-400">
                                      " {sale.notes} "
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2 mt-auto">
                                  <Button variant="danger" className="!p-3" onClick={() => handleDelete(sale.id)} title="Excluir Pedido">
                                      <Trash2 size={20} />
                                  </Button>
                                  <Button variant="primary" className="flex-grow text-lg font-bold" onClick={() => onLoadSale(sale)}>
                                      Finalizar Agora
                                  </Button>
                              </div>
                          </div>
                      ))}
                    </div>
                  )}
              </div>
              
              <div className="pt-4 border-t dark:border-gray-800 flex justify-between items-center shrink-0">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{filteredSales.length} Pedidos Ativos</span>
                  <Button variant="secondary" onClick={onBack}>
                    <ArrowLeft size={18} className="mr-2" /> Sair dos Pedidos
                  </Button>
              </div>
            </div>
        </div>
    );
};

export default ParkedSalesScreen;
