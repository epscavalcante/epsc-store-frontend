import type { FieldErrors, PaymentFields, PaymentMethod } from './types'
export function validTaxId(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (!/^(\d{11}|\d{14})$/.test(digits) || /^(\d)\1+$/.test(digits)) return false
  const numbers = [...digits].map(Number)
  const check = (base: number[], weights: number[]) => {
    const remainder = base.reduce((sum, n, i) => sum + n * weights[i]!, 0) % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  if (digits.length === 11)
    return (
      check(numbers.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[9] &&
      check(numbers.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[10]
    )
  return (
    check(numbers.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[12] &&
    check(numbers.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[13]
  )
}
export function validatePayment(method: PaymentMethod, fields: PaymentFields): FieldErrors {
  const errors: FieldErrors = {}
  if (method === 'bankslip') {
    if (fields.name.trim().length < 2) errors.name = 'Informe seu nome completo ou razão social.'
    if (!validTaxId(fields.taxId)) errors.taxId = 'Informe um CPF ou CNPJ válido.'
  }
  return errors
}
