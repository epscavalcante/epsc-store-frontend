import type { z } from 'zod'
import type { creditCardPaymentSchema, paymentSchemas } from './schemas'

export type PaymentMethod = keyof typeof paymentSchemas
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
interface CheckoutItems {
  items: { product_id: string; quantity: number }[]
}
interface CheckoutCustomer {
  name: string
  tax_id: string
}
export type CheckoutRequest = CheckoutItems &
  (
    | { payment_method: 'pix'; customer: CheckoutCustomer }
    | { payment_method: 'bankslip'; customer: CheckoutCustomer }
    | {
        payment_method: 'credit_card'
        customer: CheckoutCustomer & {
          email: string
          phone: string
          postal_code: string
          address_number: string
        }
        credit_card: {
          holder_name: string
          number: string
          expiry_month: string
          expiry_year: string
          ccv: string
        }
      }
  )
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
export type PaymentFields = z.input<typeof creditCardPaymentSchema>
export type FieldErrors = Partial<Record<keyof PaymentFields, string>>
export const currency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
