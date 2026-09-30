import type { CartItem, CheckoutRequest, CheckoutResult, CheckoutStatus, Product } from './types'

export const products: Product[] = [
  {
    id: 1,
    name: 'Caneca Essencial',
    description: 'Cerâmica · Areia · 300 ml',
    price: 4900,
    image: 'mug.svg',
  },
  {
    id: 2,
    name: 'Caderno de Ideias',
    description: 'Papel pontilhado · Verde · A5',
    price: 3900,
    image: 'notebook.svg',
  },
  {
    id: 3,
    name: 'Bolsa de Todos os Dias',
    description: 'Algodão natural · Cru',
    price: 6900,
    image: 'bag.svg',
  },
  {
    id: 4,
    name: 'Garrafa Dia a Dia',
    description: 'Aço inox · Grafite · 500 ml',
    price: 8900,
    image: 'bottle.svg',
  },
]

export function createCart(previousIds: number[] = []): CartItem[] {
  const shuffled = [...products]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  const selected = shuffled.slice(0, Math.random() < 0.5 ? 2 : 3)
  // A new test purchase always gets a different selection.
  if (selected.length === previousIds.length && selected.every((p) => previousIds.includes(p.id))) {
    const replacement = shuffled.find((p) => !previousIds.includes(p.id))!
    selected[0] = replacement
  }
  return selected.map((product) => ({ product, quantity: 1 }))
}

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
