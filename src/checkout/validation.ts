import { paymentSchemas } from './schemas.ts'
import type { FieldErrors, PaymentFields, PaymentMethod } from './types'

export function validatePayment(method: PaymentMethod, fields: PaymentFields): FieldErrors {
  const result = paymentSchemas[method].safeParse(fields)
  const errors: FieldErrors = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof PaymentFields | undefined
      if (field && !errors[field]) errors[field] = issue.message
    }
  }
  return errors
}

export function paymentFieldErrors(detail: unknown): FieldErrors {
  const errors: FieldErrors = {}
  if (!Array.isArray(detail)) return errors
  const customerFields: Record<string, keyof PaymentFields> = {
    name: 'name',
    tax_id: 'taxId',
    email: 'email',
    phone: 'phone',
    postal_code: 'postalCode',
    address_number: 'addressNumber',
  }
  const cardFields: Record<string, keyof PaymentFields> = {
    holder_name: 'holderName',
    number: 'cardNumber',
    expiry_month: 'expiryMonth',
    expiry_year: 'expiryYear',
    ccv: 'ccv',
  }
  for (const issue of detail) {
    if (!issue || typeof issue !== 'object' || !Array.isArray(issue.loc)) continue
    const field = issue.loc.at(-1)
    const group = issue.loc.at(-2)
    if (typeof field !== 'string') continue
    const key =
      group === 'customer'
        ? customerFields[field]
        : group === 'credit_card'
          ? cardFields[field]
          : undefined
    if (key) errors[key] = 'Verifique o valor informado.'
    if (
      field === 'credit_card' &&
      typeof issue.msg === 'string' &&
      issue.msg.includes('Credit card has expired')
    ) {
      errors.expiryMonth = 'O cartão está vencido.'
      errors.expiryYear = 'Informe uma validade atual ou futura.'
    }
  }
  return errors
}
