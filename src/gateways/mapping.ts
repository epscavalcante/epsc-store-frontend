import type { CheckoutStatus, Product } from '@/checkout/types'
export function reaisToCents(value: string | number): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value))
  if (!match) throw new Error('Valor monetário inválido retornado pela API.')
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  if (!Number.isSafeInteger(cents)) throw new Error('Valor monetário fora do intervalo suportado.')
  return cents
}
export function checkoutStatus(raw: string): CheckoutStatus {
  switch (raw.toLowerCase()) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'pending'
    case 'failed':
      return 'error'
    case 'cancelled':
    case 'canceled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    default:
      return 'unknown'
  }
}
export function timestamp(value: string | null): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}
export function productPresentation(id: string, name: string, price: number): Product {
  return { id, name, price, description: '', image: 'product.svg' }
}
