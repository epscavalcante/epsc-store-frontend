import type { CartItem, CheckoutRequest, CheckoutResult, CheckoutStatus } from './types'
import { products } from '@/catalog/products'

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

export function checkoutRequest(
  method: CheckoutRequest['payment_method'],
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

// Replace this adapter with POST /checkouts for integration. Card fields never
// enter the request. The real backend must supply authoritative totals/status.
export async function submitMockCheckout(
  request: CheckoutRequest,
  outcome: CheckoutStatus,
): Promise<CheckoutResult> {
  await new Promise((resolve) => setTimeout(resolve, 1100))
  const total = request.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id)
    if (!product) throw new Error('Produto não encontrado.')
    return sum + product.price * item.quantity
  }, 0)
  return {
    id: `EPSC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    status: outcome,
    items: request.items.map((item) => ({ ...item })),
    total,
    payment_method: request.payment_method,
  }
}
