export type PaymentMethod = 'pix' | 'bankslip' | 'credit_card'
export type CheckoutStatus = 'success' | 'error' | 'pending'

// Prices are represented in cents in the UI to avoid rounding errors.
export interface Product {
  id: number
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
  items: { product_id: number; quantity: number }[]
  customer?: { name: string; tax_id: string }
}
export interface CheckoutResult {
  id: string
  status: CheckoutStatus
  items: { product_id: number; quantity: number }[]
  total: number
  payment_method: PaymentMethod
}
export interface PaymentFields {
  name: string
  taxId: string
  number: string
  holder: string
  expiry: string
  securityCode: string
}
export type FieldErrors = Partial<Record<keyof PaymentFields, string>>
export const currency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
