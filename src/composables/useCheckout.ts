import { onUnmounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { ApiError } from '@/api/HttpClient'
import { checkoutGatewayKey, injectRequired } from '@/config/injectionKeys'
import { rememberOrder } from '@/checkout/orders'
import { paymentFieldErrors } from '@/checkout/validation'
import type { CheckoutRequest, CheckoutResult, FieldErrors } from '@/checkout/types'

export function useCheckout() {
  const gateway = injectRequired(checkoutGatewayKey)
  const order = ref<CheckoutResult | null>(null)
  const loading = ref(false)
  const creating = ref(false)
  const error = ref('')
  const notFound = ref(false)
  const fieldErrors = ref<FieldErrors>({})
  let controller: AbortController | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  let pollId: string | null = null
  let version = 0
  function schedule() {
    clearTimeout(timer)
    if (!disposed && pollId && order.value?.status === 'pending')
      timer = setTimeout(async () => {
        if (document.visibilityState === 'visible') await load(pollId!, { initial: false })
        else schedule()
      }, 15000)
  }
  async function load(id: string, { initial = true, notifyError = false } = {}) {
    if (disposed) return
    clearTimeout(timer)
    const current = ++version
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = ''
    if (initial) {
      order.value = null
      notFound.value = false
    }
    try {
      const result = await gateway.get(id, controller.signal)
      if (disposed || current !== version) return
      order.value = result
      rememberOrder(result.id)
    } catch (cause) {
      if (disposed || current !== version) return
      if (cause instanceof DOMException && cause.name === 'AbortError') return
      if (cause instanceof ApiError && cause.status === 404) {
        notFound.value = true
        order.value = null
        pollId = null
      }
      error.value = cause instanceof Error ? cause.message : 'Não foi possível consultar o pedido.'
      if (notifyError) {
        toast.error('Não foi possível atualizar o pedido.', {
          id: `checkout-refresh-${id}`,
          description: error.value,
        })
      }
    } finally {
      if (!disposed && current === version) {
        loading.value = false
        schedule()
      }
    }
  }
  async function create(request: CheckoutRequest) {
    if (creating.value) return null
    creating.value = true
    error.value = ''
    fieldErrors.value = {}
    try {
      const result = await gateway.create(request)
      order.value = result
      rememberOrder(result.id)
      return result
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 422)
        fieldErrors.value = paymentFieldErrors(cause.detail)
      error.value =
        cause instanceof ApiError && cause.status === 504
          ? 'O processamento demorou além do esperado. Não houve reenvio automático. Confira o pagamento com a operadora antes de tentar novamente.'
          : cause instanceof ApiError && cause.status === 0
            ? 'Não foi possível confirmar a criação do pedido. Não houve reenvio automático. Verifique a conexão antes de tentar novamente.'
            : cause instanceof ApiError &&
                request.payment_method === 'credit_card' &&
                cause.status === 400
              ? 'Os dados do cliente ou do cartão foram recusados. Verifique os campos informados.'
              : cause instanceof Error
                ? cause.message
                : 'Não foi possível criar o pedido.'
      if (!disposed) {
        toast.error('Não foi possível finalizar o pedido.', {
          id: 'checkout-create-error',
          description: error.value,
        })
      }
      return null
    } finally {
      creating.value = false
    }
  }
  function watchOrder(id: string) {
    pollId = id
    void load(id)
  }
  function refresh() {
    if (pollId) return load(pollId, { initial: false, notifyError: true })
  }
  onUnmounted(() => {
    disposed = true
    pollId = null
    clearTimeout(timer)
    controller?.abort()
  })
  return { order, loading, creating, error, notFound, fieldErrors, create, watchOrder, refresh }
}
