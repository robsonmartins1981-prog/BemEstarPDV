
import React from 'react';
import { formatCurrency } from '../../utils/formatUtils';
import type { SaleItem } from '../../types';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

interface CartProps {
  items: SaleItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemoveItem }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4 opacity-50">
          <ShoppingCart className="w-12 h-12" />
        </div>
        <p className="font-black uppercase tracking-widest text-xs text-center">Carrinho Vazio</p>
        <p className="text-[10px] uppercase font-bold mt-2 text-center">Busque produtos para iniciar a venda</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="bg-theme-primary/10 p-2 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-theme-primary" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">{item.productName}</h4>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  {formatCurrency(item.unitPrice)} / {item.unitType?.toLowerCase() || 'un'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                <button
                  onClick={() => onUpdateQuantity(item.productId, item.quantity - (item.unitType === 'KG' ? 0.1 : 1))}
                  className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all text-gray-500"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  step={item.unitType === 'KG' ? "0.001" : "1"}
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                  className="w-16 text-center font-black text-sm text-gray-800 dark:text-white bg-transparent border-none outline-none"
                />
                <button
                  onClick={() => onUpdateQuantity(item.productId, item.quantity + (item.unitType === 'KG' ? 0.1 : 1))}
                  className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all text-gray-500"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right w-24">
                <p className="font-black text-theme-primary text-sm">{formatCurrency(item.total)}</p>
              </div>

              <button
                onClick={() => onRemoveItem(item.productId)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cart;
