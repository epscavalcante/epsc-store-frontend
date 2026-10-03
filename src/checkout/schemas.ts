import { z } from 'zod'

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

const name = (message: string) => z.string().trim().min(2, message).max(100, message)
const digits = (format: RegExp, length: RegExp, message: string) =>
  z
    .string()
    .trim()
    .regex(format, message)
    .transform((value) => value.replace(/\D/g, ''))
    .pipe(z.string().regex(length, message))

export const customerPaymentSchema = z.object({
  name: name('Informe seu nome completo ou razão social (de 2 a 100 caracteres).'),
  taxId: z
    .string()
    .trim()
    .refine(validTaxId, 'Informe um CPF ou CNPJ válido.')
    .transform((value) => value.replace(/\D/g, '')),
})

export const creditCardPaymentSchema = customerPaymentSchema
  .extend({
    email: z
      .string()
      .trim()
      .max(254, 'Informe um e-mail válido.')
      .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Informe um e-mail válido.'),
    phone: digits(/^[\d\s()-]+$/, /^\d{10,11}$/, 'Informe um telefone com DDD (10 ou 11 dígitos).'),
    postalCode: digits(/^[\d\s-]+$/, /^\d{8}$/, 'Informe um CEP com 8 dígitos.'),
    addressNumber: z.string().trim().min(1, 'Informe o número do endereço.'),
    holderName: name('Informe o nome impresso no cartão (de 2 a 100 caracteres).'),
    cardNumber: digits(
      /^[\d\s-]+$/,
      /^\d{13,19}$/,
      'Informe um número de cartão com 13 a 19 dígitos.',
    ),
    expiryMonth: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])$/, 'Informe o mês entre 01 e 12.'),
    expiryYear: z
      .string()
      .trim()
      .regex(/^\d{4}$/, 'Informe o ano com 4 dígitos.'),
    ccv: z
      .string()
      .trim()
      .regex(/^\d{3,4}$/, 'Informe o código de segurança (3 ou 4 dígitos).'),
  })
  .superRefine((fields, ctx) => {
    if (!/^(0[1-9]|1[0-2])$/.test(fields.expiryMonth) || !/^\d{4}$/.test(fields.expiryYear)) return
    const today = new Date()
    if (
      Number(fields.expiryYear) * 12 + Number(fields.expiryMonth) <
      today.getUTCFullYear() * 12 + today.getUTCMonth() + 1
    ) {
      ctx.addIssue({ code: 'custom', path: ['expiryMonth'], message: 'O cartão está vencido.' })
      ctx.addIssue({
        code: 'custom',
        path: ['expiryYear'],
        message: 'Informe uma validade atual ou futura.',
      })
    }
  })

export const paymentSchemas = {
  pix: z.object({}),
  bankslip: customerPaymentSchema,
  credit_card: creditCardPaymentSchema,
}
