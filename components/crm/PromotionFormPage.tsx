import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Promotion, Product } from '../../types';
import Button from '../shared/Button';
import { v4 as uuidv4 } from 'uuid';
import { Save, ArrowLeft, Tag, Calendar, Percent, DollarSign, Search, CheckSquare, Square } from 'lucide-react';

interface PromotionFormPageProps {
  promotionId?: string;
  onBack: () => void;
}

const PromotionFormPage: React.FC<PromotionFormPageProps> = ({ promotionId, onBack }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [active, setActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [promotionId]);

  const loadData = async () => {
    const allProducts = await db.getAll('products');
    setProducts(allProducts);

    if (promotionId) {
      const promo = await db.get('promotions', promotionId);
      if (promo) {
        setName(promo.name);
        setStartDate(new Date(promo.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(promo.endDate).toISOString().split('T')[0]);
        setDiscountType(promo.discountType);
        setDiscountValue(promo.discountValue.toString());
        setActive(promo.active);
        setSelectedProducts(promo.productIds);
      }
    } else {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      setStartDate(today.toISOString().split('T')[0]);
      setEndDate(nextWeek.toISOString().split('T')[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate || !endDate || !discountValue || selectedProducts.length === 0) {
      alert('Preencha todos os campos e selecione pelo menos um produto.');
      return;
    }

    const promotion: Promotion = {
      id: promotionId || uuidv4(),
      name,
      startDate: new Date(startDate + 'T00:00:00'),
      endDate: new Date(endDate + 'T23:59:59'),
      discountType,
      discountValue: parseFloat(discountValue.replace(',', '.')),
      productIds: selectedProducts,
      active
    };

    try {
      if (promotionId) {
        await db.put('promotions', promotion);
      } else {
        await db.add('promotions', promotion);
      }
      onBack();
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert('Erro ao salvar a promoção. Tente novamente.');
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    setSelectedProducts(products.map(p => p.id));
  };

  const deselectAll = () => {
    setSelectedProducts([]);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Tag className="text-theme-primary" />
          {promotionId ? 'Editar Promoção' : 'Nova Promoção'}
        </h2>
        <Button variant="secondary" onClick={onBack} className="!py-2 !px-3">
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Promoção</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Black Friday, Queima de Estoque..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Início</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Término</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full pl-10 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Desconto</label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                  className="w-full h-[50px] px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent dark:bg-gray-700 dark:text-white text-lg font-bold"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">$</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor do Desconto</label>
                <div className="relative h-[50px]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-lg">
                      {discountType === 'PERCENTAGE' ? '%' : '$'}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    className="w-full h-full pl-12 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-shadow text-lg"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-primary/20 dark:peer-focus:ring-theme-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-theme-primary"></div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Promoção Ativa</span>
              </label>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Produtos Participantes</h3>
                <span className="text-sm font-medium text-theme-primary bg-theme-primary/10 px-2 py-1 rounded-full">
                  {selectedProducts.length} selecionados
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Buscar produtos..."
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={selectAll} className="text-xs text-theme-primary hover:underline font-medium">Selecionar Todos</button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button type="button" onClick={deselectAll} className="text-xs text-gray-500 hover:underline font-medium">Limpar Seleção</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {filteredProducts.map(product => {
                const isSelected = selectedProducts.includes(product.id);
                return (
                  <div 
                    key={product.id} 
                    onClick={() => toggleProduct(product.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${isSelected ? 'bg-theme-primary/10 border border-theme-primary/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'}`}
                  >
                    <div className={`text-${isSelected ? 'theme-primary' : 'gray-400'}`}>
                      {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isSelected ? 'text-theme-primary dark:text-theme-primary' : 'text-gray-800 dark:text-gray-200'}`}>
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        R$ {product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Nenhum produto encontrado.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
          <Button variant="primary" type="submit">
            <Save size={20} className="mr-2" /> Salvar Promoção
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PromotionFormPage;
