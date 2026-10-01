import type { CartItem, CheckoutRequest, PaymentMethod } from './types'
export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
export function checkoutRequest(
  method: PaymentMethod,
  items: CartItem[],
  name: string,
  taxId: string,
): CheckoutRequest {
  return {
    payment_method: method,
    items: items.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
    ...(method === 'bankslip'
      ? { customer: { name: name.trim(), tax_id: taxId.replace(/\D/g, '') } }
      : {}),
  }
}
