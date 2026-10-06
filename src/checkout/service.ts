import type { CartItem, CheckoutRequest, PaymentFields, PaymentMethod } from './types'
import { paymentSchemas } from './schemas.ts'
export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
export function checkoutRequest(
  method: PaymentMethod,
  items: CartItem[],
  fields: PaymentFields,
): CheckoutRequest {
  const checkoutItems = items.map(({ product, quantity }) => ({ product_id: product.id, quantity }))
  if (method === 'pix' || method === 'bankslip') {
    const parsed = paymentSchemas[method].parse(fields)
    return {
      payment_method: method,
      items: checkoutItems,
      customer: { name: parsed.name, tax_id: parsed.taxId },
    }
  }
  const parsed = paymentSchemas.credit_card.parse(fields)
  return {
    payment_method: method,
    items: checkoutItems,
    customer: {
      name: parsed.name,
      tax_id: parsed.taxId,
      email: parsed.email,
      phone: parsed.phone,
      postal_code: parsed.postalCode,
      address_number: parsed.addressNumber,
    },
    credit_card: {
      holder_name: parsed.holderName,
      number: parsed.cardNumber,
      expiry_month: parsed.expiryMonth,
      expiry_year: parsed.expiryYear,
      ccv: parsed.ccv,
    },
  }
}
