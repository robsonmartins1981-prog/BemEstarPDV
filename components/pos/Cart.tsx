import React from 'react';
import type { SaleItem } from '../../types';
import { Trash2, Tag, UserCircle, Package } from 'lucide-react';

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
    <div className="h-full flex flex-col">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Carrinho de Compras</h2>
        {customerName && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 bg-theme-primary/10 dark:bg-theme-primary/20 p-2 rounded-md">
                <UserCircle size={18} className="text-theme-primary"/>
                <span>Cliente: <strong className="text-gray-800 dark:text-gray-200">{customerName}</strong></span>
            </div>
        )}
      </div>

      {/* Lista de itens */}
      <div className="flex-grow overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>O carrinho está vazio.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-3 w-16">Img</th>
                <th scope="col" className="px-6 py-3">Produto</th>
                <th scope="col" className="px-4 py-3 text-center">Qtd.</th>
                <th scope="col" className="px-4 py-3 text-right">Preço Unit.</th>
                <th scope="col" className="px-4 py-3 text-center">Desconto (R$)</th>
                <th scope="col" className="px-6 py-3 text-right">Total</th>
                <th scope="col" className="px-1 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.productId} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-colors duration-150">
                  <td className="px-4 py-2">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 rounded-md object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {item.productName}
                  </td>
                  <td className="px-4 py-3">
                     <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item, e.target.value)}
                      className="w-20 text-center bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1"
                     />
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                   <td className="px-4 py-3 text-center">
                    <input
                      type="text"
                      // Mostra o valor do desconto ou uma string vazia se for 0
                      value={item.discount > 0 ? item.discount : ''}
                      onChange={(e) => handleDiscountChange(item, e.target.value)}
                      placeholder="0,00"
                      aria-label={`Desconto para ${item.productName}`}
                      className="w-24 text-right bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 font-mono"
                    />
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-semibold">
                    <div className="flex items-center justify-end gap-2">
                        {/* Ícone de tag aparece se houver desconto aplicado */}
                        {item.discount > 0 && <span title={`Desconto de ${formatCurrency(item.discount)} aplicado`}><Tag size={14} className="text-green-500" /></span>}
                        <span>{formatCurrency(item.total)}</span>
                    </div>
                  </td>
                  <td className="px-1 py-3 text-center">
                    <button
                      onClick={() => onRemove(item.productId)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                      aria-label="Remover item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Cart;