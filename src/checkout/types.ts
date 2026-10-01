export type PaymentMethod = 'pix' | 'bankslip'
export type CheckoutStatus = 'success' | 'error' | 'pending' | 'expired' | 'cancelled' | 'unknown'

// Prices are represented in cents in the UI to avoid rounding errors.
export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
}
export interface CartItem {
  product: Product
  quantity: number
}
export interface CheckoutRequest {
  payment_method: PaymentMethod
  items: { product_id: string; quantity: number }[]
  customer?: { name: string; tax_id: string }
}
export interface CheckoutResult {
  id: string
  status: CheckoutStatus
  rawStatus: string
  cart: CartItem[]
  total: number
  payments: CheckoutPayment[]
}
export interface CheckoutPayment {
  id: string
  status: CheckoutStatus
  rawStatus: string
  method: string
  total: number
  expiresAt: number | null
  pixCode: string | null
  pixImage: string | null
  bankslipCode: string | null
  bankslipUrl: string | null
  createdAt: number | null
}
export interface PaymentFields {
  name: string
  taxId: string
}
export type FieldErrors = Partial<Record<keyof PaymentFields, string>>
export const currency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
