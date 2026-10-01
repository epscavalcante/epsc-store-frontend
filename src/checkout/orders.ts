import { ref } from 'vue'
import type { CartItem, CheckoutResult } from './types'

export interface StoredOrder extends CheckoutResult {
  cart: CartItem[]
  createdAt: number
  pixExpiresAt: number
  boletoDueAt: number
}
const storageKey = 'epsc-store.orders.v1'

function isOrder(value: unknown): value is StoredOrder {
  if (!value || typeof value !== 'object') return false
  const order = value as StoredOrder
  return (
    typeof order.id === 'string' &&
    ['pix', 'bankslip', 'credit_card'].includes(order.payment_method) &&
    ['success', 'error', 'pending'].includes(order.status) &&
    Number.isFinite(order.total) &&
    order.total >= 0 &&
    Number.isFinite(order.createdAt) &&
    Number.isFinite(order.pixExpiresAt) &&
    Number.isFinite(order.boletoDueAt) &&
    Array.isArray(order.items) &&
    Array.isArray(order.cart) &&
    order.cart.length > 0 &&
    order.cart.every(
      (item) =>
        item &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 99 &&
        item.product &&
        Number.isInteger(item.product.id) &&
        typeof item.product.name === 'string' &&
        typeof item.product.description === 'string' &&
        typeof item.product.image === 'string' &&
        Number.isFinite(item.product.price),
    )
  )
}
function readOrders(): StoredOrder[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isOrder) : []
  } catch {
    return []
  }
}
export const savedOrders = ref<StoredOrder[]>(readOrders())
export const findOrder = (id: string) => savedOrders.value.find((order) => order.id === id) ?? null

// Save only order data and product snapshots. Payment form fields are excluded.
export function saveOrder(result: CheckoutResult, cart: CartItem[], existing?: StoredOrder | null) {
  const now = Date.now()
  const order: StoredOrder = {
    ...result,
    id: existing?.id ?? result.id,
    cart: cart.map(({ product, quantity }) => ({ product: { ...product }, quantity })),
    createdAt: existing?.createdAt ?? now,
    pixExpiresAt: now + 30 * 60 * 1000,
    boletoDueAt: now + 3 * 24 * 60 * 60 * 1000,
  }
  const orders = [order, ...savedOrders.value.filter((item) => item.id !== order.id)]
  // Fail visibly if storage is unavailable rather than lose the return link.
  localStorage.setItem(storageKey, JSON.stringify(orders))
  savedOrders.value = orders
  return order
}
