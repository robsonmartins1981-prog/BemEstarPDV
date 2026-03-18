
import { db } from '../services/databaseService';
import type { Product, Promotion } from '../types';

/**
 * Busca todas as promoções ativas no momento.
 */
export async function getActivePromotions(): Promise<Promotion[]> {
    try {
        const allPromotions = await db.getAll('promotions');
        const now = new Date();
        
        return (allPromotions || []).filter(promo => {
            if (!promo) return false;
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
 * Se houver mais de uma promoção para o mesmo produto, aplica a de menor preço.
 */
export function getPromotionalPrice(product: Product, activePromotions: Promotion[]): number {
    let lowestPrice = product.price || 0;
    let foundPromotion = false;

    for (const promo of (activePromotions || [])) {
        if (!promo || !promo.items) continue;
        const promoItem = (promo.items || []).find(item => item.productId === product.id);
        if (promoItem) {
            if (promoItem.promotionalPrice < lowestPrice) {
                lowestPrice = promoItem.promotionalPrice;
                foundPromotion = true;
            }
        }
    }

    return lowestPrice;
}

/**
 * Verifica se um produto está em promoção.
 */
export function isProductOnSale(product: Product, activePromotions: Promotion[]): boolean {
    return (activePromotions || []).some(promo => promo && (promo.items || []).some(item => item.productId === product.id));
}
