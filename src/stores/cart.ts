import { computed, ref, watch } from 'vue'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { useProductsStore } from './products'
import type { CartItem, Product } from '@/checkout/types'

interface Selection {
  productId: string
  quantity: number
}
// v2 isolates real API UUIDs from the old numeric demonstration catalog.
const storageKey = 'epsc-store.cart.v2'
function restore(): Selection[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(value)) return []
    const selections: Selection[] = []
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue
      const { productId, quantity } = entry as Partial<Selection>
      if (
        typeof productId !== 'string' ||
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity < 1
      )
        continue
      const existing = selections.find((item) => item.productId === productId)
      if (existing) existing.quantity = Math.min(99, existing.quantity + quantity)
      else selections.push({ productId, quantity: Math.min(99, quantity) })
    }
    return selections
  } catch {
    return []
  }
}
export const useCartStore = defineStore('cart', () => {
  const catalog = useProductsStore()
  const selections = ref<Selection[]>(restore())
  const locked = ref(false)
  const persistenceError = ref('')
  const items = computed<CartItem[]>(() =>
    selections.value.flatMap((item) => {
      const product = catalog.items.find((product) => product.id === item.productId)
      return product ? [{ product, quantity: item.quantity }] : []
    }),
  )
  const itemCount = computed(() =>
    selections.value.reduce((count, item) => count + item.quantity, 0),
  )
  const productCount = computed(() => selections.value.length)
  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.product.price * item.quantity, 0),
  )
  const isEmpty = computed(() => selections.value.length === 0)
  watch(
    selections,
    (value) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value))
        persistenceError.value = ''
      } catch {
        persistenceError.value = 'Não foi possível salvar o carrinho neste navegador.'
      }
    },
    { deep: true, flush: 'sync' },
  )
  watch(
    () => catalog.items,
    () => {
      if (catalog.loaded)
        selections.value = selections.value.filter((item) =>
          catalog.items.some((product) => product.id === item.productId),
        )
    },
  )
  function addProduct(product: Product) {
    if (locked.value || !catalog.items.some((item) => item.id === product.id)) return false
    const item = selections.value.find((item) => item.productId === product.id)
    if (item?.quantity === 99) return false
    if (item) item.quantity++
    else selections.value.push({ productId: product.id, quantity: 1 })
    return true
  }
  function setQuantity(id: string, quantity: number) {
    if (locked.value || !Number.isInteger(quantity)) return
    const item = selections.value.find((item) => item.productId === id)
    if (item) item.quantity = Math.max(1, Math.min(99, quantity))
  }
  function increaseQuantity(id: string) {
    const item = selections.value.find((item) => item.productId === id)
    if (item) setQuantity(id, item.quantity + 1)
  }
  function decreaseQuantity(id: string) {
    const item = selections.value.find((item) => item.productId === id)
    if (item) setQuantity(id, item.quantity - 1)
  }
  function removeProduct(id: string) {
    if (!locked.value) selections.value = selections.value.filter((item) => item.productId !== id)
  }
  function clear() {
    selections.value = []
  }
  function restoreOrder(cart: CartItem[]) {
    if (!locked.value)
      selections.value = cart
        .filter((item) => catalog.items.some((product) => product.id === item.product.id))
        .map((item) => ({
          productId: item.product.id,
          quantity: Math.max(1, Math.min(99, item.quantity)),
        }))
  }
  return {
    selections,
    items,
    locked,
    persistenceError,
    itemCount,
    productCount,
    subtotal,
    isEmpty,
    addProduct,
    setQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeProduct,
    clear,
    restoreOrder,
  }
})
if (import.meta.hot) import.meta.hot.accept(acceptHMRUpdate(useCartStore, import.meta.hot))
