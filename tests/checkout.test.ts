import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  checkoutDraft,
  emptyPaymentFields,
  resetCreditCardDraft,
  resetPaymentDraft,
} from '../src/checkout/draft.ts'
import { checkoutRequest } from '../src/checkout/service.ts'
import { creditCardPaymentSchema } from '../src/checkout/schemas.ts'
import { paymentFieldErrors, validatePayment } from '../src/checkout/validation.ts'
import type { CartItem, PaymentFields } from '../src/checkout/types.ts'

const items: CartItem[] = [
  {
    product: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Produto',
      price: 34990,
      description: '',
      image: 'product.svg',
    },
    quantity: 2,
  },
]
const fields = (): PaymentFields => ({
  name: ' Cliente Teste ',
  taxId: '529.982.247-25',
  email: ' cliente@example.com ',
  phone: '(65) 99999-9999',
  postalCode: '78000-000',
  addressNumber: ' S/N ',
  holderName: ' CLIENTE TESTE ',
  cardNumber: '4444 4444 4444 4444',
  expiryMonth: '01',
  expiryYear: String(new Date().getUTCFullYear() + 1),
  ccv: '012',
})

test('serializes a single credit card charge using the backend contract and preserves leading zeros', () => {
  const input = fields()
  assert.deepEqual(validatePayment('credit_card', input), {})
  assert.deepEqual(checkoutRequest('credit_card', items, input), {
    payment_method: 'credit_card',
    items: [{ product_id: items[0]!.product.id, quantity: 2 }],
    customer: {
      name: 'Cliente Teste',
      tax_id: '52998224725',
      email: 'cliente@example.com',
      phone: '65999999999',
      postal_code: '78000000',
      address_number: 'S/N',
    },
    credit_card: {
      holder_name: 'CLIENTE TESTE',
      number: '4444444444444444',
      expiry_month: '01',
      expiry_year: input.expiryYear,
      ccv: '012',
    },
  })
})

test('Pix and boleto neither require nor send card or contact fields', () => {
  const input = fields()
  assert.deepEqual(validatePayment('pix', emptyPaymentFields()), {})
  assert.deepEqual(
    validatePayment('bankslip', { ...emptyPaymentFields(), name: input.name, taxId: input.taxId }),
    {},
  )
  assert.deepEqual(checkoutRequest('pix', items, input), {
    payment_method: 'pix',
    items: [{ product_id: items[0]!.product.id, quantity: 2 }],
  })
  assert.deepEqual(checkoutRequest('bankslip', items, input), {
    payment_method: 'bankslip',
    items: [{ product_id: items[0]!.product.id, quantity: 2 }],
    customer: { name: 'Cliente Teste', tax_id: '52998224725' },
  })
})

test('Zod prevents serializing invalid customer or credit card data', () => {
  assert.equal(creditCardPaymentSchema.safeParse({ ...fields(), ccv: '12' }).success, false)
  assert.throws(() => checkoutRequest('credit_card', items, { ...fields(), ccv: '12' }))
  assert.throws(() => checkoutRequest('bankslip', items, { ...fields(), taxId: '123' }))
})

test('every required card and customer field reports an error when missing', () => {
  const errors = validatePayment('credit_card', emptyPaymentFields())
  assert.deepEqual(Object.keys(errors).sort(), Object.keys(emptyPaymentFields()).sort())
})

test('validates card and customer input against backend limits', () => {
  const invalid: [keyof PaymentFields, string][] = [
    ['name', 'A'],
    ['name', 'A'.repeat(101)],
    ['taxId', '11111111111'],
    ['email', 'cliente@exemplo'],
    ['email', `${'a'.repeat(250)}@b.com`],
    ['phone', '659999999'],
    ['phone', '5565999999999'],
    ['phone', '65999999999x'],
    ['postalCode', '7800000'],
    ['postalCode', '780000000'],
    ['postalCode', '78000000x'],
    ['addressNumber', '  '],
    ['holderName', 'A'],
    ['holderName', 'A'.repeat(101)],
    ['cardNumber', '1'.repeat(12)],
    ['cardNumber', '1'.repeat(20)],
    ['cardNumber', '444444444444444x'],
    ['expiryMonth', '00'],
    ['expiryMonth', '13'],
    ['expiryMonth', '1'],
    ['expiryYear', '26'],
    ['expiryYear', 'abcd'],
    ['ccv', '12'],
    ['ccv', '12345'],
    ['ccv', 'abc'],
  ]
  for (const [field, value] of invalid)
    assert.ok(
      validatePayment('credit_card', { ...fields(), [field]: value })[field],
      `${field}: ${value}`,
    )
  for (const number of ['1'.repeat(13), '1'.repeat(19)])
    assert.deepEqual(
      validatePayment('credit_card', { ...fields(), cardNumber: number, ccv: '0123' }),
      {},
    )
})

test('accepts the current month and rejects the previous month, including January rollover', () => {
  const today = new Date()
  const current = {
    ...fields(),
    expiryMonth: String(today.getUTCMonth() + 1).padStart(2, '0'),
    expiryYear: String(today.getUTCFullYear()),
  }
  assert.deepEqual(validatePayment('credit_card', current), {})
  const lastMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1))
  const errors = validatePayment('credit_card', {
    ...fields(),
    expiryMonth: String(lastMonth.getUTCMonth() + 1).padStart(2, '0'),
    expiryYear: String(lastMonth.getUTCFullYear()),
  })
  assert.ok(errors.expiryMonth)
  assert.ok(errors.expiryYear)
})

test('maps nested API field errors and card model expiration errors to the form', () => {
  const locations = [
    ['customer', 'name', 'name'],
    ['customer', 'tax_id', 'taxId'],
    ['customer', 'email', 'email'],
    ['customer', 'phone', 'phone'],
    ['customer', 'postal_code', 'postalCode'],
    ['customer', 'address_number', 'addressNumber'],
    ['credit_card', 'holder_name', 'holderName'],
    ['credit_card', 'number', 'cardNumber'],
    ['credit_card', 'expiry_month', 'expiryMonth'],
    ['credit_card', 'expiry_year', 'expiryYear'],
    ['credit_card', 'ccv', 'ccv'],
  ]
  for (const [group, apiField, formField] of locations)
    assert.deepEqual(Object.keys(paymentFieldErrors([{ loc: ['body', group, apiField] }])), [
      formField,
    ])
  assert.deepEqual(
    Object.keys(
      paymentFieldErrors([
        { loc: ['body', 'credit_card'], msg: 'Value error, Credit card has expired' },
      ]),
    ).sort(),
    ['expiryMonth', 'expiryYear'],
  )
  assert.deepEqual(paymentFieldErrors([null, {}, { loc: ['body', 'items', 0, 'quantity'] }]), {})
  assert.deepEqual(paymentFieldErrors('Invalid input'), {})
})

test('clears card data when leaving checkout and clears the full draft after success', () => {
  Object.assign(checkoutDraft.fields, fields())
  checkoutDraft.method = 'credit_card'
  resetCreditCardDraft()
  for (const key of ['holderName', 'cardNumber', 'expiryMonth', 'expiryYear', 'ccv'] as const)
    assert.equal(checkoutDraft.fields[key], '')
  assert.equal(checkoutDraft.fields.email, fields().email)
  resetPaymentDraft()
  assert.equal(checkoutDraft.method, 'pix')
  assert.deepEqual(checkoutDraft.fields, emptyPaymentFields())
})
