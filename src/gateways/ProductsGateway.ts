import type { HttpClient } from '@/api/HttpClient'
import type { Product } from '@/checkout/types'
import { productPresentation, reaisToCents } from './mapping'
export interface ProductsGateway {
  list(): Promise<Product[]>
}
export class ProductsHttpGateway implements ProductsGateway {
  constructor(private readonly http: HttpClient) {}
  async list(): Promise<Product[]> {
    const response =
      await this.http.request<{ id: string; name: string; price: number | string }[]>('/products')
    if (!Array.isArray(response)) throw new Error('Formato de catálogo inválido.')
    return response.map((product) =>
      productPresentation(product.id, product.name, reaisToCents(product.price)),
    )
  }
}
