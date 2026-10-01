<script setup lang="ts">
import { computed } from 'vue'
import type { CartItem } from '@/checkout/types'
import { currency } from '@/checkout/types'
import { cartTotal } from '@/checkout/service'
import StoreIcon from './StoreIcon.vue'
const props = defineProps<{
  items: CartItem[]
  total?: number
  disabled?: boolean
  readonly?: boolean
}>()
defineEmits<{ quantity: [productId: number, change: number]; remove: [productId: number] }>()
const assetBase = import.meta.env.BASE_URL
const itemCount = computed(() => props.items.reduce((count, item) => count + item.quantity, 0))
const total = computed(() => props.total ?? cartTotal(props.items))
</script>
<template>
  <aside
    class="min-w-0 border-l border-stroke bg-panel px-8 pt-[42px] pb-[38px] max-wide:px-7 max-wide:pt-10 max-wide:pb-8 max-checkout:row-start-1 max-checkout:border-b max-checkout:border-l-0 max-checkout:px-6 max-checkout:py-7 max-narrow:px-[18px]"
    aria-labelledby="summary-title"
  >
    <div
      class="mb-8 flex items-center justify-between gap-3 max-checkout:mb-[25px] [&>span]:text-xs [&>span]:whitespace-nowrap [&>span]:text-muted"
    >
      <h2 class="text-[17px] font-[650] tracking-[-.25px]" id="summary-title">Resumo do pedido</h2>
      <span aria-live="polite">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'itens' }}</span>
    </div>
    <div class="mb-[22px] border-b border-stroke">
      <article
        v-for="item in items"
        :key="item.product.id"
        class="mb-7 grid grid-cols-[70px_minmax(0,1fr)_auto] items-start gap-[14px] max-narrow:grid-cols-[60px_minmax(0,1fr)_auto] max-narrow:gap-2.5 [&>img]:h-[78px] [&>img]:w-[70px] [&>img]:rounded-md [&>img]:border [&>img]:border-stroke [&>img]:object-cover max-narrow:[&>img]:w-[60px]"
      >
        <img
          :src="`${assetBase}products/${item.product.image}`"
          :alt="item.product.name"
          width="76"
          height="86"
        />
        <div
          class="[&_h3]:text-[13px] [&_h3]:leading-[1.4] [&_p]:mt-[5px] [&_p]:text-[11px] [&_p]:leading-[1.6] [&_p]:text-muted"
        >
          <h3 class="text-sm font-semibold">{{ item.product.name }}</h3>
          <p>{{ item.product.description }}</p>
          <span class="mt-[3px] block text-[10px] text-muted"
            >{{ currency(item.product.price) }} / un.</span
          >
          <div
            v-if="!readonly"
            class="mt-[9px] inline-flex h-[26px] items-center rounded border border-stroke bg-control [&_button]:h-6 [&_button]:w-[25px] [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[13px] [&_button]:text-[#e3e8ec] [&_button:enabled:hover]:bg-[#3a4147] [&_button:disabled]:text-[#78838c] [&_span]:min-w-[21px] [&_span]:text-center [&_span]:text-[10px]"
            :aria-label="`Quantidade de ${item.product.name}`"
          >
            <button
              type="button"
              :disabled="disabled || item.quantity <= 1"
              :aria-label="`Diminuir quantidade de ${item.product.name}`"
              @click="$emit('quantity', item.product.id, -1)"
            >
              −
            </button>
            <span aria-live="polite">{{ item.quantity }}</span>
            <button
              type="button"
              :disabled="disabled || item.quantity >= 99"
              :aria-label="`Aumentar quantidade de ${item.product.name}`"
              @click="$emit('quantity', item.product.id, 1)"
            >
              +
            </button>
          </div>
          <button
            v-if="!readonly"
            type="button"
            :disabled="disabled"
            :aria-label="`Remover ${item.product.name} do carrinho`"
            class="mt-2 block text-[10px] text-muted underline underline-offset-2 disabled:opacity-50"
            @click="$emit('remove', item.product.id)"
          >
            Remover
          </button>
          <span v-if="readonly" class="mt-[3px] block text-[10px] text-muted"
            >Quantidade: {{ item.quantity }}</span
          >
        </div>
        <strong
          class="self-center text-xs font-normal whitespace-nowrap max-narrow:text-[11px]"
          aria-live="polite"
          >{{ currency(item.product.price * item.quantity) }}</strong
        >
      </article>
    </div>
    <div
      class="my-[17px] flex justify-between text-xs text-muted [&>span:last-child]:text-foreground"
    >
      <span>Subtotal</span><span>{{ currency(total) }}</span>
    </div>
    <div
      class="my-[17px] flex justify-between text-xs text-muted [&>span:last-child]:text-foreground"
    >
      <span>Entrega</span><span>Não se aplica</span>
    </div>
    <div
      class="mt-[27px] flex items-center justify-between gap-2.5 border-t border-stroke pt-[23px] [&>div]:flex [&>div]:items-baseline [&>div]:gap-[5px] [&_strong]:text-[17px] [&_strong]:font-semibold [&>strong]:text-[25px] [&>strong]:font-normal [&>strong]:tracking-[-.8px] [&_small]:text-[10px] [&_small]:text-muted"
    >
      <div><strong>Total</strong><small>BRL</small></div>
      <strong aria-live="polite" aria-atomic="true">{{ currency(total) }}</strong>
    </div>
    <p
      class="mt-[34px] flex items-start gap-2 text-[10px] leading-[1.7] text-subtle [&_svg]:shrink-0"
    >
      <StoreIcon name="bag" :size="17" /> Produtos da sua compra de teste.
    </p>
  </aside>
</template>
