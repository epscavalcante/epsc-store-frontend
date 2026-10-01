<script setup lang="ts">
import { ref } from 'vue'
import { products } from '@/catalog/products'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/checkout/types'
import { currency } from '@/checkout/types'
import StoreIcon from '@/components/StoreIcon.vue'

const cartStore = useCartStore()
const feedback = ref('')
function addProduct(product: Product) {
  feedback.value = cartStore.addProduct(product)
    ? `${product.name} adicionado ao carrinho. ${cartStore.itemCount} itens no total.`
    : 'A quantidade máxima deste produto é 99.'
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

    <p role="status" class="mb-4 text-xs text-success empty:hidden">{{ feedback }}</p>
    <p v-if="cartStore.persistenceError" role="status" class="mb-4 text-xs text-pending">
      {{ cartStore.persistenceError }}
    </p>
    <div class="flex flex-wrap justify-center gap-6">
      <article
        v-for="product in products"
        :key="product.id"
        class="flex min-w-0 basis-[calc((100%_-_3rem)/3)] flex-col overflow-hidden rounded-lg border border-stroke bg-panel max-checkout:basis-[calc((100%_-_1.5rem)/2)] max-compact:basis-full"
      >
        <img
          :src="`${assetBase}products/${product.image}`"
          :alt="product.name"
          width="400"
          height="300"
          class="aspect-[4/3] w-full object-cover"
        />
        <div class="flex flex-1 flex-col p-5">
          <h2 class="text-base font-semibold">{{ product.name }}</h2>
          <p class="mt-2 text-xs leading-relaxed text-muted">{{ product.description }}</p>
          <p class="mt-4 text-xl font-medium tracking-tight">{{ currency(product.price) }}</p>
          <button
            type="button"
            :disabled="cartStore.locked"
            @click="addProduct(product)"
            class="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-md border border-action bg-action px-4 py-3 text-sm font-medium text-inset transition-colors hover:border-action-hover hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            <StoreIcon name="bag" :size="18" />Adicionar ao carrinho
          </button>
        </div>
      </article>
    </div>
  </main>
</template>
