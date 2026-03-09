import { db } from '../services/databaseService';
import type { Promotion, Product } from '../types';

export const getActivePromotions = async (): Promise<Promotion[]> => {
  const allPromotions = await db.getAll('promotions');
  const now = new Date();
  
  return allPromotions.filter(promo => {
    if (!promo.active) return false;
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    return now >= startDate && now <= endDate;
  });
};

export const getPromotionalPrice = (product: Product, activePromotions: Promotion[]): number => {
  let lowestPrice = product.price;

  for (const promo of activePromotions) {
    if (promo.productIds.includes(product.id)) {
      let promoPrice = product.price;
      if (promo.discountType === 'PERCENTAGE') {
        promoPrice = product.price * (1 - promo.discountValue / 100);
      } else if (promo.discountType === 'FIXED') {
        promoPrice = Math.max(0, product.price - promo.discountValue);
      }
      
      if (promoPrice < lowestPrice) {
        lowestPrice = promoPrice;
      }
    }
  }

  return lowestPrice;
};
