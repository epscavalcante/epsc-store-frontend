import type { HttpClient } from '@/api/HttpClient'
import type { CheckoutPayment, CheckoutRequest, CheckoutResult } from '@/checkout/types'
import { checkoutStatus, productPresentation, reaisToCents, timestamp } from './mapping'
interface CheckoutDto {
  id: string
  status: string
  total: string
  items: { product_id: string; name: string; price: string; subtotal: string; quantity: number }[]
  payments?: {
    id: string
    status: string
    method: string
    total: string
    expires_at: string | null
    pix_qr_code: string | null
    pix_qr_code_encoded: string | null
    bankslip_bar_code: string | null
    bankslip_url: string | null
    created_at: string
  }[]
}
export interface CheckoutGateway {
  create(request: CheckoutRequest): Promise<CheckoutResult>
  get(id: string, signal?: AbortSignal): Promise<CheckoutResult>
}
function mapCheckout(dto: CheckoutDto): CheckoutResult {
  const payments: CheckoutPayment[] = (dto.payments ?? []).map((payment) => ({
    id: payment.id,
    status: checkoutStatus(payment.status),
    rawStatus: payment.status,
    method: payment.method,
    total: reaisToCents(payment.total),
    expiresAt: timestamp(payment.expires_at),
    pixCode: payment.pix_qr_code,
    pixImage: payment.pix_qr_code_encoded
      ? payment.pix_qr_code_encoded.startsWith('data:image/png;base64,') ||
        payment.pix_qr_code_encoded.startsWith('data:image/jpeg;base64,')
        ? payment.pix_qr_code_encoded
        : `data:image/png;base64,${payment.pix_qr_code_encoded}`
      : null,
    bankslipCode: payment.bankslip_bar_code,
    bankslipUrl: payment.bankslip_url,
    createdAt: timestamp(payment.created_at),
  }))
  return {
    id: dto.id,
    status: checkoutStatus(dto.status),
    rawStatus: dto.status,
    total: reaisToCents(dto.total),
    payments,
    cart: dto.items.map((item) => ({
      product: productPresentation(item.product_id, item.name, reaisToCents(item.price)),
      quantity: item.quantity,
    })),
  }
}
export class CheckoutHttpGateway implements CheckoutGateway {
  constructor(private readonly http: HttpClient) {}
  async create(request: CheckoutRequest) {
    return mapCheckout(
      await this.http.request<CheckoutDto>('/checkouts', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    )
  }
  async get(id: string, signal?: AbortSignal) {
    return mapCheckout(
      await this.http.request<CheckoutDto>(`/checkouts/${encodeURIComponent(id)}`, { signal }),
    )
  }
}
