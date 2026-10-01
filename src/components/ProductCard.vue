<script setup lang="ts">
import type { Product } from '@/checkout/types'
import { currency } from '@/checkout/types'
import StoreIcon from './StoreIcon.vue'

withDefaults(
  defineProps<{
    product: Product
    cartQuantity?: number
    disabled?: boolean
  }>(),
  {
    cartQuantity: 0,
    disabled: false,
  },
)

defineEmits<{ add: [product: Product] }>()

const assetBase = import.meta.env.BASE_URL
</script>

<template>
  <article class="flex min-w-0 flex-col overflow-hidden rounded-lg border border-stroke bg-panel">
    <div class="relative">
      <img
        :src="`${assetBase}products/${product.image}`"
        :alt="product.name"
        width="400"
        height="300"
        class="aspect-[4/3] w-full object-cover"
      />
      <span
        v-if="cartQuantity"
        class="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-stroke bg-panel px-3 py-1.5 text-xs font-medium text-action shadow-sm"
      >
        <StoreIcon name="cart" :size="14" />
        {{ cartQuantity }} no carrinho
      </span>
    </div>
    <div class="flex flex-1 flex-col p-5">
      <h2 class="text-base font-semibold">{{ product.name }}</h2>
      <p class="mt-2 text-xs leading-relaxed text-muted">{{ product.description }}</p>
      <p class="mt-4 text-xl font-medium tracking-tight">{{ currency(product.price) }}</p>
      <button
        type="button"
        :disabled="disabled"
        class="mt-5 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-md border border-action bg-action px-4 py-3 text-sm font-medium text-inset transition-colors hover:border-action-hover hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        @click="$emit('add', product)"
      >
        <StoreIcon name="bag" :size="18" />Adicionar ao carrinho
      </button>
    </div>
  </article>
</template>
