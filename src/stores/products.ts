import { ref } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { injectRequired, productsGatewayKey } from '@/config/injectionKeys'
import type { Product } from '@/checkout/types'

export const useProductsStore = defineStore('products', () => {
  const gateway = injectRequired(productsGatewayKey)
  const items = ref<Product[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  let request: Promise<void> | null = null
  function load(force = false): Promise<void> {
    if (request) return request
    if (loaded.value && !force) return Promise.resolve()
    loading.value = true
    error.value = ''
    request = gateway
      .list()
      .then((products) => {
        items.value = products
        loaded.value = true
      })
      .catch((cause: unknown) => {
        error.value =
          cause instanceof Error ? cause.message : 'Não foi possível carregar os produtos.'
      })
      .finally(() => {
        loading.value = false
        request = null
      })
    return request
  }
  return { items, loading, loaded, error, load }
})
if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useProductsStore, import.meta.hot))
