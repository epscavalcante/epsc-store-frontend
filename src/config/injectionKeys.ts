import { inject, type InjectionKey } from 'vue'
import type { CheckoutGateway } from '@/gateways/CheckoutGateway'
import type { ProductsGateway } from '@/gateways/ProductsGateway'
export const checkoutGatewayKey: InjectionKey<CheckoutGateway> = Symbol('CheckoutGateway')
export const productsGatewayKey: InjectionKey<ProductsGateway> = Symbol('ProductsGateway')
export function injectRequired<T>(key: InjectionKey<T>): T {
  const dependency = inject(key)
  if (!dependency) throw new Error(`Dependência não registrada: ${key.description}`)
  return dependency
}
