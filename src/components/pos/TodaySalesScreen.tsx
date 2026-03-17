
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ReceiptText, Search, Calendar, User, DollarSign, Clock } from 'lucide-react';
import { db } from '../../services/databaseService';
import { Sale } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { safeLocaleString } from '../../utils/dateUtils';
import Button from '../shared/Button';

interface TodaySalesScreenProps {
  onBack: () => void;
  onViewReceipt: (sale: Sale) => void;
}

const TodaySalesScreen: React.FC<TodaySalesScreenProps> = ({ onBack, onViewReceipt }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const allSales = await db.getAll('sales');
      console.log('Todas as vendas encontradas:', allSales.length);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySales = allSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= today;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('Vendas de hoje filtradas:', todaySales.length);
      setSales(todaySales);
    } catch (error) {
      console.error("Erro ao carregar vendas de hoje:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale => 
    sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customerCPF && sale.customerCPF.includes(searchTerm))
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">Vendas de Hoje</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Histórico de movimentação diária</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={fetchSales} disabled={loading}>
            Atualizar
          </Button>
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-theme-primary outline-none"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary mb-4"></div>
            <p className="font-bold uppercase tracking-widest text-xs">Carregando Vendas...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ReceiptText size={64} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">Nenhuma venda encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-theme-primary/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-theme-primary/10 text-theme-primary rounded-xl group-hover:bg-theme-primary group-hover:text-white transition-colors">
                    <ReceiptText size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Venda #{sale.id.slice(0, 8)}</p>
                      {sale.isSynced && <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[8px] font-black uppercase rounded-full">Sincronizada</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={12} /> {new Date(sale.date).toLocaleTimeString()}
                      </p>
                      {sale.customerCPF && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <User size={12} /> CPF: {sale.customerCPF}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total da Venda</p>
                    <p className="text-xl font-black text-theme-primary">{formatCurrency(sale.totalAmount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onViewReceipt(sale)}
                      className="p-2 hover:bg-theme-primary/10 rounded-lg text-theme-primary transition-colors" 
                      title="Ver Comprovante"
                    >
                      <ReceiptText size={20} />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors" title="Ver Detalhes">
                      <ArrowLeft size={20} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaySalesScreen;
