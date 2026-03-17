import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Promotion } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { safeDate, safeLocaleDateString } from '../../utils/dateUtils';
import Button from '../shared/Button';
import { Plus, Edit, Trash2, Tag, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface PromotionsScreenProps {
  onNewPromotion: () => void;
  onEditPromotion: (id: string) => void;
}

const PromotionsScreen: React.FC<PromotionsScreenProps> = ({ onNewPromotion, onEditPromotion }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const data = await db.getAll('promotions');
    setPromotions(data);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deleteConfirmId === id) {
      try {
        await db.delete('promotions', id);
        setDeleteConfirmId(null);
        await fetchPromotions();
      } catch (error) {
        console.error('Erro ao excluir promoção:', error);
      }
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const toggleActive = async (promotion: Promotion) => {
    const updated = { ...promotion, active: !promotion.active };
    await db.put('promotions', updated);
    fetchPromotions();
  };

  const isPromotionRunning = (promo: Promotion) => {
    if (!promo.active) return false;
    const now = new Date();
    const startDate = safeDate(promo.startDate);
    const endDate = safeDate(promo.endDate);
    if (!startDate || !endDate) return false;
    return now >= startDate && now <= endDate;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Promoções</h2>
          <p className="text-gray-600 dark:text-gray-400">Gerencie descontos temporários para produtos selecionados.</p>
        </div>
        <Button variant="primary" onClick={onNewPromotion}>
          <Plus size={20} className="mr-2" /> Nova Promoção
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map(promo => {
          const running = isPromotionRunning(promo);
          return (
            <div key={promo.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${running ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'} p-5 flex flex-col`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${running ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    <Tag size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{promo.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar size={12} />
                      <span>
                        {safeLocaleDateString(promo.startDate)} até {safeLocaleDateString(promo.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-grow">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Desconto</span>
                  <span className="font-bold text-theme-primary">
                    {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Produtos</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{promo.productIds.length} itens</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <button 
                    onClick={() => toggleActive(promo)}
                    className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${promo.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                  >
                    {promo.active ? <><CheckCircle size={14}/> Ativa</> : <><XCircle size={14}/> Inativa</>}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                <Button variant="secondary" className="flex-1" onClick={() => onEditPromotion(promo.id)}>
                  <Edit size={16} className="mr-2" /> Editar
                </Button>
                <Button 
                  type="button" 
                  variant={deleteConfirmId === promo.id ? 'primary' : 'danger'} 
                  className={`!p-3 transition-all ${deleteConfirmId === promo.id ? 'bg-red-600 hover:bg-red-700' : ''}`} 
                  onClick={(e) => handleDelete(e, promo.id)}
                  title={deleteConfirmId === promo.id ? 'Clique novamente para confirmar' : 'Excluir promoção'}
                >
                  {deleteConfirmId === promo.id ? <span className="text-[10px] font-black uppercase">Confirmar?</span> : <Trash2 size={16} />}
                </Button>
              </div>
            </div>
          );
        })}
        {promotions.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <Tag size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Nenhuma promoção cadastrada</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Crie promoções para oferecer descontos temporários em seus produtos.</p>
            <Button variant="primary" onClick={onNewPromotion}>
              <Plus size={20} className="mr-2" /> Criar Primeira Promoção
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsScreen;
