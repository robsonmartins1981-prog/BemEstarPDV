
import { db } from '../services/databaseService';
import type { Product, Promotion } from '../types';

/**
 * Busca todas as promoções ativas no momento.
 */
export async function getActivePromotions(): Promise<Promotion[]> {
    try {
        const allPromotions = await db.getAll('promotions');
        const now = new Date();
        
        return allPromotions.filter(promo => {
            const startDate = new Date(promo.startDate);
            const endDate = new Date(promo.endDate);
            return promo.active && now >= startDate && now <= endDate;
        });
    } catch (error) {
        console.error("Erro ao buscar promoções ativas:", error);
        return [];
    }
}

/**
 * Calcula o preço promocional de um produto com base nas promoções ativas.
 * Se houver mais de uma promoção para o mesmo produto, aplica a de maior desconto.
 */
export function getPromotionalPrice(product: Product, activePromotions: Promotion[]): number {
    const productPromos = activePromotions.filter(promo => promo.productIds.includes(product.id));
    
    if (productPromos.length === 0) return product.price;

    let bestPrice = product.price;

    for (const promo of productPromos) {
        let currentPromoPrice = product.price;
        
        if (promo.discountType === 'PERCENTAGE') {
            currentPromoPrice = product.price * (1 - promo.discountValue / 100);
        } else if (promo.discountType === 'FIXED') {
            currentPromoPrice = Math.max(0, product.price - promo.discountValue);
        }

        if (currentPromoPrice < bestPrice) {
            bestPrice = currentPromoPrice;
        }
    }

    return bestPrice;
}

/**
 * Verifica se um produto está em promoção.
 */
export function isProductOnSale(product: Product, activePromotions: Promotion[]): boolean {
    return activePromotions.some(promo => promo.productIds.includes(product.id));
}
