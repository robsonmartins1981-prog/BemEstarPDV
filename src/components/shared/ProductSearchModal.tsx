
import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, X, Check } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { db } from '../../services/databaseService';
import { formatCurrency, formatQuantity } from '../../utils/formatUtils';
import type { Product } from '../../types';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product | null) => void;
  title?: string;
}

const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Pesquisar Produto'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await db.getAll('products');
      setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm) ||
    p.id.includes(searchTerm)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Buscar por nome, código ou código de barras..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 transition-all font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          <button
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <p className="font-black uppercase text-xs text-emerald-600 dark:text-emerald-400 tracking-tight">Criar Novo Item</p>
                <p className="text-[10px] text-emerald-500/70 font-bold uppercase">Não vincular a nenhum produto existente</p>
              </div>
            </div>
            <Check size={20} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
          </button>

          {loading ? (
            <div className="py-8 text-center text-gray-400 font-bold uppercase text-[10px] animate-pulse">Carregando produtos...</div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => {
                  onSelect(product);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-theme-primary hover:bg-theme-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl group-hover:bg-theme-primary/10 group-hover:text-theme-primary transition-all">
                    <Package size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-black uppercase text-xs text-gray-800 dark:text-white tracking-tight">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">ID: {product.id}</span>
                      {product.barcode && <span className="text-[10px] text-gray-400 font-bold uppercase">• EAN: {product.barcode}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-theme-primary text-sm">{formatCurrency(product.price)}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Estoque: {formatQuantity(product.stock)}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center space-y-4">
              <Package size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Nenhum produto encontrado</p>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => { onSelect(null); onClose(); }}
                className="mx-auto"
              >
                <Plus size={16} className="mr-2" /> Criar como Novo Item
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProductSearchModal;
