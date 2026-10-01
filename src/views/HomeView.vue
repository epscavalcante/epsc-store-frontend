<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { useProductsStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/checkout/types'
import { currency } from '@/checkout/types'
import StoreIcon from '@/components/StoreIcon.vue'

const cartStore = useCartStore()
const catalog = useProductsStore()
const cartQuantities = computed(
  () => new Map(cartStore.items.map((item) => [item.product.id, item.quantity])),
)
onMounted(() => {
  void catalog.load()
})
function addProduct(product: Product) {
  if (cartStore.locked) return
  const previousQuantity = cartQuantities.value.get(product.id) ?? 0
  const id = `cart-${product.id}`
  if (!cartStore.addProduct(product)) {
    toast.warning('Não foi possível adicionar o produto.', {
      id,
      description:
        previousQuantity >= 99
          ? 'A quantidade máxima deste produto é 99.'
          : 'Atualize a lista de produtos e tente novamente.',
    })
    return
  }
  toast.success(
    previousQuantity ? 'Quantidade atualizada no carrinho.' : 'Produto adicionado ao carrinho.',
    {
      id,
      description: `${product.name} · ${previousQuantity + 1} ${previousQuantity ? 'unidades' : 'unidade'}.`,
    },
  )
}
const assetBase = import.meta.env.BASE_URL
</script>

<template>
  <main class="px-12 py-10 max-wide:px-8 max-checkout:px-6 max-narrow:px-[18px]">
    <div class="mb-8">
      <p class="mb-3 text-[10px] font-medium tracking-[1.8px] text-muted">FEITO PARA O DIA A DIA</p>
      <h1 class="text-[28px] font-[650] leading-tight tracking-[-1.1px]">Nossos produtos.</h1>
      <p class="mt-3 text-sm leading-relaxed text-muted">
        Uma seleção de essenciais, com atenção aos pequenos detalhes.
      </p>
    </div>

    <p v-if="cartStore.persistenceError" role="status" class="mb-4 text-xs text-pending">
      {{ cartStore.persistenceError }}
    </p>
    <p v-if="catalog.loading" role="status" class="py-12 text-center text-muted">
      Carregando produtos…
    </p>
    <div v-else-if="catalog.error" role="alert" class="py-10 text-center">
      <p class="text-sm text-danger">{{ catalog.error }}</p>
      <button
        type="button"
        class="mt-4 text-sm underline underline-offset-4"
        @click="catalog.load(true)"
      >
        Tentar novamente
      </button>
    </div>
    <p v-else-if="!catalog.items.length" class="py-12 text-center text-muted">
      Nenhum produto disponível no momento.
    </p>
    <div v-else class="flex flex-wrap justify-center gap-6">
  <article v-for="product in catalog.items" :key="product.id" class="basis-[calc((100%_-_3rem)/3)] max-checkout:basis-[calc((100%_-_1.5rem)/2)] max-compact:basis-full flex min-w-0 flex-col overflow-hidden rounded-lg border border-stroke bg-panel">
    <div class="relative">
      <img
        :src="`${assetBase}products/${product.image}`"
        :alt="product.name"
        width="400"
        height="300"
        class="aspect-[4/3] w-full object-cover"
      />
    </div>
    <div class="flex flex-1 flex-col p-5">
      <h2 class="text-base font-semibold">{{ product.name }}</h2>
      <p class="mt-2 text-xs leading-relaxed text-muted">{{ product.description }}</p>
      <p class="mt-4 text-xl font-medium tracking-tight">{{ currency(product.price) }}</p>
      <button
        type="button"
        :disabled="cartStore.locked"
        class="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-md border border-action bg-action px-4 py-3 text-sm font-medium text-inset transition-colors hover:border-action-hover hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        @click="addProduct(product)"
      >
        <StoreIcon name="bag" :size="18" />Adicionar ao carrinho
      </button>
    </div>
  </article>
    </div>
  </main>
</template>
