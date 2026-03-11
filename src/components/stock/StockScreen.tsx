
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Product, StockMovement, StockAlert } from '../../types';
import Button from '../shared/Button';
import { Package, AlertTriangle, History, ArrowUpRight, ArrowDownRight, Search, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface StockScreenProps {
  setView: (view: any) => void;
}

/**
 * Módulo de Controle de Estoque
 */
const StockScreen: React.FC<StockScreenProps> = ({ setView }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'alerts' | 'history'>('inventory');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carrega os dados do banco de dados
   */
  const loadData = async () => {
    const allProducts = await db.getAll('products');
    const allAlerts = await db.getAll('stockAlerts');
    const allMovements = await db.getAll('stockMovements');
    
    setProducts(allProducts);
    setAlerts(allAlerts.filter(a => !a.isResolved));
    setMovements(allMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  /**
   * Filtra os produtos com base no termo de busca
   */
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  /**
   * Registra uma nova movimentação de estoque
   */
  const handleAddMovement = async (productId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', reason: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newStock = type === 'IN' ? product.stock + quantity : product.stock - quantity;
    
    const movement: StockMovement = {
      id: uuidv4(),
      productId,
      quantity,
      type,
      reason,
      date: new Date(),
      costPrice: type === 'IN' ? product.costPrice : undefined
    };

    await db.put('stockMovements', movement);
    await db.put('products', { ...product, stock: newStock });
    
    // Verifica se precisa gerar alerta
    if (product.minStock && newStock <= product.minStock) {
      const alert: StockAlert = {
        id: uuidv4(),
        productId,
        productName: product.name,
        currentStock: newStock,
        minStock: product.minStock,
        date: new Date(),
        isResolved: false
      };
      await db.put('stockAlerts', alert);
    }

    loadData();
    setIsMovementModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-theme-primary/10 p-2 rounded-lg">
            <Package className="w-6 h-6 text-theme-primary" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Controle de Estoque</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => loadData()}>Atualizar</Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'inventory' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}
        >
          Inventário
        </button>
        <button 
          onClick={() => setActiveTab('alerts')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'alerts' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400'}`}
        >
          Alertas ({alerts.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'border-theme-primary text-theme-primary' : 'border-transparent text-gray-400'}`}
        >
          Histórico
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4">
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar produto por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-theme-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-white">{product.name}</h3>
                      <p className="text-[10px] text-gray-400 uppercase font-black">{product.barcode || 'Sem código'}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${product.stock <= (product.minStock || 0) ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {product.stock} em estoque
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <div className="text-xs">
                      <span className="text-gray-400">Custo: </span>
                      <span className="font-bold text-gray-700 dark:text-gray-300">R$ {product.costPrice?.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => { setSelectedProduct(product); setIsMovementModalOpen(true); }}
                      className="p-2 bg-theme-primary/10 text-theme-primary rounded-lg hover:bg-theme-primary hover:text-white transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest">Nenhum alerta crítico</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-l-4 border-red-500 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-100 p-2 rounded-full">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white">{alert.productName}</h4>
                      <p className="text-xs text-gray-500">Estoque atual: <span className="font-black text-red-500">{alert.currentStock}</span> / Mínimo: {alert.minStock}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm">Resolver</Button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Data</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Produto</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Tipo</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Qtd</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {movements.map(m => {
                  const prod = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-gray-500">{new Date(m.date).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-800 dark:text-white">{prod?.name || 'Desconhecido'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          m.type === 'IN' ? 'bg-green-100 text-green-600' : 
                          m.type === 'OUT' ? 'bg-red-100 text-red-600' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {m.type === 'IN' ? 'Entrada' : m.type === 'OUT' ? 'Saída' : 'Ajuste'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs font-black text-right ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.type === 'IN' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{m.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Movement Modal Placeholder */}
      {isMovementModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-6 text-gray-800 dark:text-white">Movimentar Estoque</h2>
            <p className="text-sm text-gray-500 mb-4">Produto: <span className="font-bold text-gray-800 dark:text-white">{selectedProduct.name}</span></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Quantidade</label>
                <input id="mov-qty" type="number" className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-xl outline-none" defaultValue={1} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Tipo</label>
                <select id="mov-type" className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-xl outline-none">
                  <option value="IN">Entrada (Compra/Reposição)</option>
                  <option value="OUT">Saída (Perda/Avaria)</option>
                  <option value="ADJUSTMENT">Ajuste de Inventário</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Motivo</label>
                <input id="mov-reason" type="text" className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border-none rounded-xl outline-none" placeholder="Ex: Reposição de estoque" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="secondary" className="flex-1" onClick={() => setIsMovementModalOpen(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={() => {
                const qty = Number((document.getElementById('mov-qty') as HTMLInputElement).value);
                const type = (document.getElementById('mov-type') as HTMLSelectElement).value as any;
                const reason = (document.getElementById('mov-reason') as HTMLInputElement).value;
                handleAddMovement(selectedProduct.id, qty, type, reason);
              }}>Confirmar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockScreen;
