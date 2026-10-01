import { reactive } from 'vue'
import { useCartStore } from '@/stores/cart'
import type { CheckoutStatus, PaymentFields, PaymentMethod } from './types'
import type { StoredOrder } from './orders'

const emptyFields = (): PaymentFields => ({
  name: '',
  taxId: '',
  number: '',
  holder: '',
  expiry: '',
  securityCode: '',
})
// Draft form data stays in memory, never in localStorage.
export const checkoutDraft = reactive({
  method: 'pix' as PaymentMethod,
  outcome: 'pending' as CheckoutStatus,
  fields: emptyFields(),
})
export function startNewPurchase() {
  useCartStore().clear()
  checkoutDraft.method = 'pix'
  checkoutDraft.outcome = 'pending'
  Object.assign(checkoutDraft.fields, emptyFields())
}
export function resumeFailedOrder(order: StoredOrder) {
  useCartStore().restoreOrder(order.cart)
  checkoutDraft.method = order.payment_method
  checkoutDraft.outcome = 'success'
}
