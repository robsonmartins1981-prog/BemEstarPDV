import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Promotion, Product, PromotionItem } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { safeLocaleDateString } from '../../utils/dateUtils';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ProductSearchModal from '../shared/ProductSearchModal';
import { 
  Tag, Plus, Edit, Trash2, Calendar, Package, 
  CheckCircle2, XCircle, ChevronRight, Search,
  Percent, ArrowRight, AlertCircle, Clock, X
} from 'lucide-react';

const PromotionsScreen: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState<Partial<Promotion>>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    items: [],
    active: true
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('promotions');
      setPromotions(data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate || !formData.items?.length) {
      alert('Por favor, preencha todos os campos e adicione pelo menos um produto.');
      return;
    }

    try {
      const promotionToSave = {
        ...formData,
        id: editingPromotion?.id || crypto.randomUUID(),
      } as Promotion;

      await db.put('promotions', promotionToSave);
      setIsModalOpen(false);
      setEditingPromotion(null);
      setFormData({ name: '', startDate: '', endDate: '', items: [], active: true });
      fetchPromotions();
    } catch (error) {
      console.error('Erro ao salvar promoção:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta promoção?')) {
      await db.delete('promotions', id);
      fetchPromotions();
    }
  };

  const toggleActive = async (promotion: Promotion) => {
    const updated = { ...promotion, active: !promotion.active };
    await db.put('promotions', updated);
    fetchPromotions();
  };

  const openEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData(promotion);
    setIsModalOpen(true);
  };

  const addProductToPromotion = (product: Product | null) => {
    if (!product) return;
    
    // Check if product already in list
    if (formData.items?.some(item => item.productId === product.id)) {
      alert('Este produto já está na promoção.');
      return;
    }

    const newItem: PromotionItem = {
      productId: product.id,
      productName: product.name,
      originalPrice: product.price,
      promotionalPrice: product.price * 0.9 // Default 10% off
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const updatePromotionalPrice = (productId: string, price: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.map(item => 
        item.productId === productId ? { ...item, promotionalPrice: price } : item
      ) || []
    }));
  };

  const removeProductFromPromotion = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.productId !== productId) || []
    }));
  };

  const isPromotionActive = (promo: Promotion) => {
    if (!promo.active) return false;
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Campanhas Promocionais</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestão de Ofertas e Automação de Preços</p>
        </div>
        <Button onClick={() => { 
          setEditingPromotion(null); 
          setFormData({ 
            name: '', 
            startDate: new Date().toISOString().split('T')[0], 
            endDate: new Date().toISOString().split('T')[0], 
            items: [], 
            active: true 
          }); 
          setIsModalOpen(true); 
        }}>
          <Plus size={20} className="mr-2" /> Nova Campanha
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-theme-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carregando Campanhas...</p>
        </div>
      ) : promotions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {promotions.map(promo => {
            const isActive = isPromotionActive(promo);
            return (
              <div key={promo.id} className="bg-white dark:bg-gray-800 rounded-[32px] border dark:border-gray-700 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                        <Tag size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-800 dark:text-white uppercase text-sm leading-tight">{promo.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            {isActive ? 'Ativa Agora' : 'Inativa'}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} /> {promo.items.length} Produtos
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(promo)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-blue-500 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Início</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{safeLocaleDateString(promo.startDate)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Término</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{safeLocaleDateString(promo.endDate)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amostra de Produtos</p>
                    <div className="max-h-32 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                      {promo.items.slice(0, 5).map(item => (
                        <div key={item.productId} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{item.productName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-400 line-through">{formatCurrency(item.originalPrice)}</span>
                            <span className="text-[10px] font-black text-emerald-500">{formatCurrency(item.promotionalPrice)}</span>
                          </div>
                        </div>
                      ))}
                      {promo.items.length > 5 && (
                        <p className="text-[9px] text-center font-bold text-gray-400 uppercase py-1">+ {promo.items.length - 5} outros produtos</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t dark:border-gray-700 flex justify-between items-center">
                    <button 
                      onClick={() => toggleActive(promo)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${promo.active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                    >
                      {promo.active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {promo.active ? 'Campanha Ativa' : 'Campanha Pausada'}
                    </button>
                    <button onClick={() => openEdit(promo)} className="text-[10px] font-black text-theme-primary uppercase tracking-widest flex items-center gap-1 hover:underline">
                      Ver Detalhes <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-[40px] p-20 text-center border dark:border-gray-700 shadow-sm">
          <Tag size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-6" />
          <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight mb-2">Sem Campanhas Ativas</h3>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-8">Crie sua primeira promoção para automatizar preços</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={20} className="mr-2" /> Criar Campanha
          </Button>
        </div>
      )}

      {/* Promotion Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPromotion ? 'Editar Campanha' : 'Nova Campanha'}
        size="xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome da Campanha</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Black Friday 2026"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Data Início</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                    value={formData.startDate}
                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Data Término</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                    value={formData.endDate}
                    onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex gap-3">
                <AlertCircle size={20} className="text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase">
                  O motor de regras aplicará automaticamente o preço promocional durante este período. Após o término, o preço retornará ao valor padrão.
                </p>
              </div>
            </div>

            <div className="space-y-4 flex flex-col h-full">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1">Produtos na Campanha</label>
                <button 
                  type="button" 
                  onClick={() => setIsProductSearchOpen(true)}
                  className="text-[10px] font-black text-theme-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Adicionar Produto
                </button>
              </div>
              
              <div className="flex-grow bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700 overflow-hidden flex flex-col min-h-[300px]">
                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {formData.items?.map(item => (
                    <div key={item.productId} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm animate-in slide-in-from-right duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <span className="text-xs font-black text-gray-800 dark:text-white uppercase truncate max-w-[180px]">{item.productName}</span>
                        </div>
                        <button type="button" onClick={() => removeProductFromPromotion(item.productId)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Preço Normal</p>
                          <p className="text-xs font-bold text-gray-500">{formatCurrency(item.originalPrice)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Preço Promo</p>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full pl-7 pr-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-lg outline-none focus:border-emerald-500 font-black text-emerald-600 dark:text-emerald-400 text-xs"
                              value={item.promotionalPrice}
                              onChange={e => updatePromotionalPrice(item.productId, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <Package size={32} className="text-gray-200 dark:text-gray-700" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nenhum produto selecionado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1">Salvar Campanha</Button>
          </div>
        </form>
      </Modal>

      <ProductSearchModal
        isOpen={isProductSearchOpen}
        onClose={() => setIsProductSearchOpen(false)}
        onSelect={addProductToPromotion}
        title="Adicionar Produto à Promoção"
      />
    </div>
  );
};

export default PromotionsScreen;
