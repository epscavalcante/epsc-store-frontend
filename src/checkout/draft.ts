import { reactive } from 'vue'
import type { PaymentMethod } from './types'
export const checkoutDraft = reactive({
  method: 'pix' as PaymentMethod,
  fields: { name: '', taxId: '' },
})
export function resetPaymentDraft() {
  checkoutDraft.method = 'pix'
  checkoutDraft.fields.name = ''
  checkoutDraft.fields.taxId = ''
}
