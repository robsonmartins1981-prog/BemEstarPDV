
import React, { useState, useEffect } from 'react';
import { BarChart, Boxes, AlertTriangle, Search, Filter, ArrowRight, History, Calendar, Package, Plus, Minus, Save, X } from 'lucide-react';
import { db } from '../../services/databaseService';
import type { Product, InventoryLot, InventoryAdjustment, StockMovement } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, formatQuantity } from '../../utils/formatUtils';
import Button from '../shared/Button';

const InventoryReport: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({ quantity: 0, reason: '', lotId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProducts, allLots] = await Promise.all([
        db.getAll('products'),
        db.getAll('inventoryLots')
      ]);
      setProducts(allProducts);
      setLots(allLots);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustment = async () => {
    if (!selectedProduct || adjustmentData.quantity === 0) return;

    try {
      const adjustment: InventoryAdjustment = {
        id: uuidv4(),
        productId: selectedProduct.id,
        lotId: adjustmentData.lotId || 'manual',
        quantityChange: adjustmentData.quantity,
        reason: adjustmentData.reason || 'Ajuste Manual',
        date: new Date()
      };

      const movement: StockMovement = {
        id: uuidv4(),
        productId: selectedProduct.id,
        quantity: Math.abs(adjustmentData.quantity),
        type: adjustmentData.quantity > 0 ? 'IN' : 'OUT',
        reason: `Ajuste: ${adjustmentData.reason}`,
        date: new Date()
      };

      // Update product stock
      const updatedProduct = { ...selectedProduct, stock: selectedProduct.stock + adjustmentData.quantity };
      
      await Promise.all([
        db.put('inventoryAdjustments', adjustment),
        db.put('stockMovements', movement),
        db.put('products', updatedProduct)
      ]);

      // If lotId is provided, update lot quantity too
      if (adjustmentData.lotId && adjustmentData.lotId !== 'manual') {
        const lot = lots.find(l => l.id === adjustmentData.lotId);
        if (lot) {
          await db.put('inventoryLots', { ...lot, quantity: lot.quantity + adjustmentData.quantity });
        }
      }

      setIsAdjusting(false);
      setSelectedProduct(null);
      setAdjustmentData({ quantity: 0, reason: '', lotId: '' });
      loadData();
    } catch (error) {
      console.error('Error saving adjustment:', error);
      alert('Erro ao salvar ajuste.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  
  const expiringLots = lots.filter(l => {
    if (!l.expirationDate) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return new Date(l.expirationDate) <= thirtyDaysFromNow && l.quantity > 0;
  });

  if (loading) return <div className="p-8 text-center font-black uppercase tracking-widest text-gray-400">Carregando Inventário...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-theme-primary/10 p-3 rounded-2xl">
            <BarChart className="w-8 h-8 text-theme-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Inventário e Validade</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Controle de estoque, lotes e vencimentos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="pl-12 pr-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary transition-all w-full md:w-64 font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="secondary">
            <History size={18} className="mr-2" /> Histórico
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl">
            <Boxes className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h3 className="font-black uppercase text-[10px] text-gray-400 tracking-widest mb-1">Valor Total Estoque</h3>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{formatCurrency(totalInventoryValue)}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="font-black uppercase text-[10px] text-gray-400 tracking-widest mb-1">Produtos Vencendo (30 dias)</h3>
            <p className="text-2xl font-black text-red-500">{expiringLots.length}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl">
            <Package className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-black uppercase text-[10px] text-gray-400 tracking-widest mb-1">Total de Itens</h3>
            <p className="text-2xl font-black text-gray-800 dark:text-white">{products.reduce((acc, p) => acc + p.stock, 0)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-black uppercase text-sm tracking-widest text-gray-400">Lista de Produtos e Lotes</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estoque Total</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lotes / Validade</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const productLots = lots.filter(l => l.productId === product.id && l.quantity > 0);
                return (
                  <tr key={product.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800 dark:text-white uppercase">{product.name}</p>
                      <p className="text-[10px] text-gray-400">SKU: {product.barcode || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${product.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {formatQuantity(product.stock)} {product.unitType || (product.isBulk ? 'KG' : 'UN')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {productLots.length > 0 ? (
                        <div className="space-y-2">
                          {productLots.map(lot => {
                            const isExpiring = lot.expirationDate && new Date(lot.expirationDate) <= new Date(new Date().setDate(new Date().getDate() + 30));
                            return (
                              <div key={lot.id} className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded uppercase">Lote: {lot.lotNumber || 'S/N'}</span>
                                <span className="text-gray-400">Qtd: {lot.quantity}</span>
                                {lot.expirationDate && (
                                  <span className={`flex items-center gap-1 ${isExpiring ? 'text-red-500' : 'text-gray-500'}`}>
                                    <Calendar size={10} />
                                    {new Date(lot.expirationDate).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Sem lotes registrados</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsAdjusting(true);
                        }}
                      >
                        Ajustar Estoque
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Modal */}
      {isAdjusting && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Ajuste de Estoque</h3>
              <button onClick={() => setIsAdjusting(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Produto</p>
                <p className="font-bold text-gray-800 dark:text-white uppercase">{selectedProduct.name}</p>
                <p className="text-xs text-gray-500">Estoque Atual: {selectedProduct.stock}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold"
                      value={adjustmentData.quantity}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lote (Opcional)</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                    value={adjustmentData.lotId}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, lotId: e.target.value })}
                  >
                    <option value="manual">Ajuste Geral</option>
                    {lots.filter(l => l.productId === selectedProduct.id).map(l => (
                      <option key={l.id} value={l.id}>Lote: {l.lotNumber || 'S/N'} ({l.quantity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Motivo do Ajuste</label>
                <input 
                  type="text" 
                  placeholder="Ex: Quebra, Vencimento, Erro de contagem..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setIsAdjusting(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleAdjustment}>
                  <Save size={18} className="mr-2" /> Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReport;
