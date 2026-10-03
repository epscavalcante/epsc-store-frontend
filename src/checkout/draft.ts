import { reactive } from 'vue'
import type { PaymentFields, PaymentMethod } from './types'
export const emptyPaymentFields = (): PaymentFields => ({
  name: '',
  taxId: '',
  email: '',
  phone: '',
  postalCode: '',
  addressNumber: '',
  holderName: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  ccv: '',
})
export const checkoutDraft = reactive({
  method: 'pix' as PaymentMethod,
  fields: emptyPaymentFields(),
})
export function resetCreditCardDraft() {
  checkoutDraft.fields.holderName = ''
  checkoutDraft.fields.cardNumber = ''
  checkoutDraft.fields.expiryMonth = ''
  checkoutDraft.fields.expiryYear = ''
  checkoutDraft.fields.ccv = ''
}
export function resetPaymentDraft() {
  checkoutDraft.method = 'pix'
  Object.assign(checkoutDraft.fields, emptyPaymentFields())
}
