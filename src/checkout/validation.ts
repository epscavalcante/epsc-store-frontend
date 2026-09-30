import type { FieldErrors, PaymentFields, PaymentMethod } from './types'

export function validTaxId(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (!/^(\d{11}|\d{14})$/.test(digits) || /^(\d)\1+$/.test(digits)) return false
  const numbers = [...digits].map(Number)
  const check = (base: number[], weights: number[]) => {
    const remainder = base.reduce((sum, n, i) => sum + n * weights[i]!, 0) % 11
    return remainder < 2 ? 0 : 11 - remainder
  }
  if (digits.length === 11) {
    return (
      check(numbers.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[9] &&
      check(numbers.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[10]
    )
  }
  return (
    check(numbers.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[12] &&
    check(numbers.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === numbers[13]
  )
}

export function validatePayment(
  method: PaymentMethod,
  fields: PaymentFields,
  now = new Date(),
): FieldErrors {
  const errors: FieldErrors = {}
  if (method === 'bankslip') {
    if (fields.name.trim().length < 3) errors.name = 'Informe um nome com pelo menos 3 caracteres.'
    if (!validTaxId(fields.taxId)) errors.taxId = 'Informe um CPF ou CNPJ válido.'
  }
  if (method === 'credit_card') {
    const digits = fields.number.replace(/\s/g, '')
    const sum = [...digits].reverse().reduce((total, digit, index) => {
      let n = Number(digit) * (index % 2 ? 2 : 1)
      if (n > 9) n -= 9
      return total + n
    }, 0)
    if (!/^\d{13,19}$/.test(digits) || /^(\d)\1+$/.test(digits) || sum % 10 !== 0) {
      errors.number = 'Use o cartão de teste: 4242 4242 4242 4242.'
    }
    if (fields.holder.trim().length < 3) errors.holder = 'Informe o nome do titular.'
    const match = /^(\d{2})\/(\d{2})$/.exec(fields.expiry)
    const month = Number(match?.[1])
    const year = 2000 + Number(match?.[2])
    if (
      !match ||
      month < 1 ||
      month > 12 ||
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1)
    ) {
      errors.expiry = 'Informe uma validade futura no formato MM/AA.'
    }
    if (!/^\d{3,4}$/.test(fields.securityCode)) errors.securityCode = 'Informe 3 ou 4 dígitos.'
  }
  return errors
}
