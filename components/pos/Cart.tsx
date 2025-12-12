
import React from 'react';
import type { SaleItem } from '../../types';
import { Trash2, Tag, UserCircle, Package, AlertCircle } from 'lucide-react';

interface CartProps {
  items: SaleItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onUpdateDiscount: (productId: string, newDiscount: number) => void;
  customerName?: string;
}

// Formata um número para o padrão de moeda brasileiro (BRL).
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Componente que exibe o carrinho de compras.
// Mostra a lista de itens, permitindo a remoção e alteração de quantidade.
const Cart: React.FC<CartProps> = ({ items, onRemove, onUpdateQuantity, onUpdateDiscount, customerName }) => {

  const handleQuantityChange = (item: SaleItem, value: string) => {
    const newQuantity = parseFloat(value.replace(',', '.'));
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      onUpdateQuantity(item.productId, newQuantity);
    }
  };
  
  const handleDiscountChange = (item: SaleItem, value: string) => {
    const newDiscount = parseFloat(value.replace(',', '.'));
    // Se o campo estiver vazio ou o valor for inválido, considera o desconto como 0.
    onUpdateDiscount(item.productId, isNaN(newDiscount) ? 0 : newDiscount);
  };


  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800/50">
      <div className="p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm z-10">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-theme-primary"/>
                Carrinho <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({items.length} itens)</span>
            </h2>
        </div>
        {customerName && (
            <div className="flex items-center gap-2 mt-3 text-sm text-theme-primary bg-theme-primary/10 border border-theme-primary/20 p-2 rounded-md">
                <UserCircle size={18} />
                <span>Cliente vinculado: <strong className="font-semibold">{customerName}</strong></span>
            </div>
        )}
      </div>

      {/* Lista de itens */}
      <div className="flex-grow overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 space-y-4">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Package className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-medium">O carrinho está vazio</p>
            <p className="text-sm">Adicione produtos para começar a venda</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-500 uppercase bg-gray-100 dark:bg-gray-900/50 dark:text-gray-400 sticky top-0 shadow-sm z-10">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold w-16 text-center">Img</th>
                <th scope="col" className="px-4 py-3 font-semibold">Produto</th>
                <th scope="col" className="px-2 py-3 font-semibold text-center w-24">Qtd.</th>
                <th scope="col" className="px-2 py-3 font-semibold text-right hidden sm:table-cell">Unitário</th>
                <th scope="col" className="px-2 py-3 font-semibold text-center w-28">Desc. (R$)</th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">Total</th>
                <th scope="col" className="px-2 py-3 font-semibold text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {items.map(item => {
                const hasDiscount = item.discount > 0;
                const originalTotal = item.unitPrice * item.quantity;
                
                return (
                <tr key={item.productId} className={`group transition-colors duration-150 ${hasDiscount ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                  {/* Imagem */}
                  <td className="px-4 py-3 text-center">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover mx-auto shadow-sm border border-gray-100 dark:border-gray-600" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto text-gray-400">
                        <Package size={20} />
                      </div>
                    )}
                  </td>
                  
                  {/* Nome do Produto */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                            {item.productName}
                        </span>
                        {hasDiscount && (
                            <span className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1 font-medium">
                                <Tag size={10} /> Desconto aplicado
                            </span>
                        )}
                    </div>
                  </td>

                  {/* Quantidade */}
                  <td className="px-2 py-3 text-center">
                     <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, e.target.value)}
                      className="w-16 text-center bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 focus:ring-2 focus:ring-theme-primary focus:border-transparent font-medium"
                     />
                  </td>

                  {/* Preço Unitário (Hidden on very small screens) */}
                  <td className="px-2 py-3 text-right text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {formatCurrency(item.unitPrice)}
                  </td>

                  {/* Input de Desconto */}
                   <td className="px-2 py-3 text-center">
                    <div className="relative">
                        <input
                        type="text"
                        value={item.discount > 0 ? item.discount : ''}
                        onChange={(e) => handleDiscountChange(item, e.target.value)}
                        placeholder="0,00"
                        className={`w-20 text-right text-sm rounded-md py-1.5 px-2 border transition-colors focus:ring-2 focus:ring-theme-primary focus:border-transparent ${
                            hasDiscount 
                                ? 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:border-orange-500/50 dark:text-orange-300 font-bold' 
                                : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 text-gray-600'
                        }`}
                        />
                    </div>
                  </td>

                  {/* Total da Linha */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end justify-center h-full">
                        {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through decoration-gray-400 mb-0.5">
                                {formatCurrency(originalTotal)}
                            </span>
                        )}
                        <span className={`font-bold font-mono text-base ${hasDiscount ? 'text-theme-primary' : 'text-gray-800 dark:text-gray-200'}`}>
                            {formatCurrency(item.total)}
                        </span>
                    </div>
                  </td>

                  {/* Ação (Remover) */}
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => onRemove(item.productId)}
                      className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remover item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Cart;
