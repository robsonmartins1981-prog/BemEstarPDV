
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ListOrdered, Clock, User, MapPin, DollarSign, ChevronRight, CheckCircle2, Trash2 } from 'lucide-react';
import { db } from '../../services/databaseService';
import { ParkedSale } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import Button from '../shared/Button';

interface ParkedSalesScreenProps {
  onBack: () => void;
  onLoadSale: (sale: ParkedSale) => void;
  onFinalizeDelivery: (sale: ParkedSale) => void;
}

const ParkedSalesScreen: React.FC<ParkedSalesScreenProps> = ({ onBack, onLoadSale, onFinalizeDelivery }) => {
  const [parkedSales, setParkedSales] = useState<ParkedSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParkedSales = async () => {
    setLoading(true);
    try {
      const sales = await db.getAll('parkedSales');
      setParkedSales(sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Erro ao carregar pedidos em aberto:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkedSales();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    try {
      await db.delete('parkedSales', id);
      setParkedSales(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      alert('Erro ao excluir pedido.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center gap-4 shrink-0">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black uppercase tracking-tight">Pedidos em Aberto / Delivery</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gerenciamento de vendas pausadas e entregas</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchParkedSales} disabled={loading}>
          Atualizar
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mb-4"></div>
            <p className="font-bold uppercase tracking-widest text-xs">Carregando Pedidos...</p>
          </div>
        ) : parkedSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ListOrdered size={64} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">Nenhum pedido em aberto</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {parkedSales.map((sale) => (
              <div key={sale.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:border-theme-primary/30 transition-all group">
                <div className="p-5 border-b border-gray-50 dark:border-gray-700/50 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-theme-primary/10 text-theme-primary rounded-xl">
                      <ListOrdered size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Pedido #{sale.id.slice(0, 6)}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {new Date(sale.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(sale.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="p-5 flex-1 space-y-4">
                  {sale.notes && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observações</p>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300 italic">"{sale.notes}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Itens</p>
                      <p className="text-sm font-bold">{sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</p>
                      <p className="text-sm font-black text-theme-primary">{formatCurrency(sale.total)}</p>
                    </div>
                  </div>

                  {sale.deliveryAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-theme-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço de Entrega</p>
                        <p className="text-xs font-medium line-clamp-2">{sale.deliveryAddress}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-3">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-[10px] font-black uppercase"
                    onClick={() => onLoadSale(sale)}
                  >
                    Recuperar
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full text-[10px] font-black uppercase"
                    onClick={() => onFinalizeDelivery(sale)}
                  >
                    Finalizar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkedSalesScreen;
