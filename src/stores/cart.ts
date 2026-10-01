import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { products } from '@/catalog/products'
import type { CartItem, Product } from '@/checkout/types'

const storageKey = 'epsc-store.cart.v1'
const maxQuantity = 99

function restoreCart(): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(saved)) return []
    const items: CartItem[] = []
    for (const entry of saved) {
      if (!entry || typeof entry !== 'object') continue
      const { productId, quantity } = entry as { productId?: unknown; quantity?: unknown }
      const product = products.find((item) => item.id === productId)
      if (!product || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1)
        continue
      const existing = items.find((item) => item.product.id === product.id)
      if (existing) existing.quantity = Math.min(maxQuantity, existing.quantity + quantity)
      else items.push({ product: { ...product }, quantity: Math.min(maxQuantity, quantity) })
    }
    return items
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(restoreCart())
  const locked = ref(false)
  const persistenceError = ref('')
  const itemCount = computed(() => items.value.reduce((count, item) => count + item.quantity, 0))
  const productCount = computed(() => items.value.length)
  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.product.price * item.quantity, 0),
  )
  const isEmpty = computed(() => items.value.length === 0)

  watch(
    items,
    (cart) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(
            cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          ),
        )
        persistenceError.value = ''
      } catch {
        persistenceError.value =
          'O carrinho está disponível nesta sessão, mas não foi possível salvá-lo neste navegador.'
      }
    },
    { deep: true, flush: 'sync' },
  )

  function addProduct(product: Product) {
    if (locked.value) return false
    const catalogProduct = products.find((item) => item.id === product.id)
    if (!catalogProduct) return false
    const item = items.value.find((item) => item.product.id === product.id)
    if (item?.quantity === maxQuantity) return false
    if (item) item.quantity++
    else items.value.push({ product: { ...catalogProduct }, quantity: 1 })
    return true
  }
  function setQuantity(productId: number, quantity: number) {
    if (locked.value || !Number.isInteger(quantity)) return
    const item = items.value.find((item) => item.product.id === productId)
    if (item) item.quantity = Math.min(maxQuantity, Math.max(1, quantity))
  }
  function increaseQuantity(productId: number) {
    const item = items.value.find((item) => item.product.id === productId)
    if (item) setQuantity(productId, item.quantity + 1)
  }
  function decreaseQuantity(productId: number) {
    const item = items.value.find((item) => item.product.id === productId)
    if (item) setQuantity(productId, item.quantity - 1)
  }
  function removeProduct(productId: number) {
    if (!locked.value) items.value = items.value.filter((item) => item.product.id !== productId)
  }
  function clear() {
    items.value = []
  }
  function restoreOrder(cart: CartItem[]) {
    if (locked.value) return
    items.value = cart.flatMap(({ product, quantity }) => {
      const current = products.find((item) => item.id === product.id)
      return current
        ? [{ product: { ...current }, quantity: Math.max(1, Math.min(maxQuantity, quantity)) }]
        : []
    })
  }
  return {
    items,
    itemCount,
    productCount,
    subtotal,
    isEmpty,
    locked,
    persistenceError,
    addProduct,
    setQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeProduct,
    clear,
    restoreOrder,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot))
}
