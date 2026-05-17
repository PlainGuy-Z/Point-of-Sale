import type { Product } from '../types';

export function getEffectivePrice(product: Product): {
  price: number;
  isPromoActive: boolean;
  discountPercent: number;
  savings: number;
} {
  if (
    product.isPromo === true &&
    product.promoPrice != null &&
    product.promoPrice > 0 &&
    product.promoPrice < product.price &&
    (product.discount ?? 0) > 0  // strict guard
  ) {
    const savings = product.price - product.promoPrice;
    const discountPercent = Math.round((savings / product.price) * 100);
    return { price: product.promoPrice, isPromoActive: true, discountPercent, savings };
  }

  return { price: product.price, isPromoActive: false, discountPercent: 0, savings: 0 };
}
