<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCheckout } from '@/composables/useCheckout'
import { useProductsStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { resetPaymentDraft } from '@/checkout/draft'
import { currency } from '@/checkout/types'
import OrderSummary from '@/components/OrderSummary.vue'
import PendingPayment from '@/components/PendingPayment.vue'
import StoreIcon from '@/components/StoreIcon.vue'

const route = useRoute()
const router = useRouter()
const catalog = useProductsStore()
const cart = useCartStore()
const { order, loading, error, notFound, watchOrder, refresh } = useCheckout()
watchOrder(String(route.params.id))
const heading = computed(() => {
  switch (order.value?.status) {
    case 'success':
      return 'Pagamento confirmado!'
    case 'pending':
      return order.value.payments.some((payment) => payment.method === 'credit_card')
        ? 'Aguardando confirmação do pagamento'
        : 'Aguardando pagamento'
    case 'error':
      return 'Pagamento não concluído'
    case 'expired':
      return 'Pagamento expirado'
    case 'cancelled':
      return 'Pedido cancelado'
    default:
      return 'Detalhes do pedido'
  }
})
const orderUrl = window.location.href
const feedback = ref('')
const restoring = ref(false)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(feedbackTimer))
async function copyLink() {
  try {
    await navigator.clipboard.writeText(orderUrl)
    feedback.value = 'Link copiado.'
  } catch {
    feedback.value = 'Selecione o link e copie manualmente.'
  }
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = ''
  }, 3000)
}
async function rebuildCart() {
  if (!order.value || restoring.value || cart.locked) return
  restoring.value = true
  try {
    await catalog.load()
    if (catalog.error) {
      feedback.value = catalog.error
      return
    }
    cart.restoreOrder(order.value.cart)
    resetPaymentDraft()
    await router.push({ name: 'checkout' })
  } finally {
    restoring.value = false
  }
}
</script>

<template>
  <main v-if="order" class="grid grid-cols-[1.08fr_1fr] items-stretch max-checkout:grid-cols-1">
    <section class="min-w-0 px-12 py-10 max-wide:px-8 max-checkout:row-start-2 max-checkout:px-6">
      <span
        class="mb-6 grid size-[62px] place-items-center rounded-full"
        :class="
          order.status === 'success'
            ? 'bg-success-surface text-success'
            : order.status === 'pending'
              ? 'bg-pending-surface text-pending'
              : 'bg-control text-muted'
        "
        ><StoreIcon
          :name="
            order.status === 'success' ? 'check' : order.status === 'pending' ? 'clock' : 'error'
          "
          :size="32"
      /></span>
      <h1 class="text-[26px] font-semibold tracking-tight">{{ heading }}</h1>
      <p class="mt-3 text-sm leading-relaxed text-muted">
        {{
          order.status === 'success'
            ? 'O pagamento foi confirmado pelo servidor.'
            : order.status === 'pending'
              ? order.payments.some((payment) => payment.method === 'credit_card')
                ? 'Seu pedido foi criado. O pagamento com cartão está aguardando confirmação.'
                : 'Seu pedido foi criado. Consulte as instruções abaixo para realizar o pagamento.'
              : `Status informado pelo servidor: ${order.rawStatus}.`
        }}
      </p>
      <dl class="my-6 space-y-3 border-t border-stroke pt-5 text-xs">
        <div>
          <dt class="text-muted">Pedido</dt>
          <dd class="mt-1 break-all font-medium">{{ order.id }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted">Valor confirmado</dt>
          <dd>{{ currency(order.total) }}</dd>
        </div>
      </dl>
      <div class="mb-6 rounded-md border border-stroke bg-inset p-4">
        <label for="order-link" class="mb-2 block text-xs">Link para voltar a este pedido</label>
        <input
          id="order-link"
          :value="orderUrl"
          readonly
          class="w-full rounded-field border border-stroke-input bg-control p-2.5 text-xs text-muted"
        />
        <button type="button" class="mt-3 text-xs underline underline-offset-4" @click="copyLink">
          Copiar link do pedido
        </button>
        <p role="status" class="mt-2 text-xs text-muted">{{ feedback }}</p>
      </div>
      <p v-if="error" role="alert" class="mb-4 text-xs text-danger">
        Não foi possível atualizar. {{ error }} Os últimos dados consultados continuam visíveis.
      </p>
      <button
        type="button"
        :disabled="loading"
        class="mb-6 text-xs underline underline-offset-4 disabled:opacity-50"
        @click="refresh"
      >
        {{ loading ? 'Atualizando…' : 'Atualizar pagamento' }}
      </button>
      <template v-if="order.status === 'pending'">
        <PendingPayment v-for="payment in order.payments" :key="payment.id" :payment="payment" />
        <p v-if="!order.payments.length" class="mb-6 text-sm text-muted">
          As instruções de pagamento ainda não estão disponíveis. Atualize a consulta em alguns
          instantes.
        </p>
        <p class="mb-6 text-[11px] text-subtle">
          O status é atualizado automaticamente enquanto esta página está aberta.
        </p>
      </template>
      <button
        v-if="['error', 'expired', 'cancelled'].includes(order.status)"
        type="button"
        :disabled="restoring || cart.locked"
        class="mb-5 w-full rounded-md border border-stroke bg-control px-4 py-3 text-sm disabled:opacity-50"
        @click="rebuildCart"
      >
        {{ restoring ? 'Carregando produtos…' : 'Refazer compra com estes produtos' }}
      </button>
      <RouterLink
        :to="{ name: 'home' }"
        class="flex w-full justify-center rounded-md bg-action px-5 py-4 text-sm font-medium text-inset hover:bg-action-hover"
        >Voltar à Home</RouterLink
      >
    </section>
    <OrderSummary :items="order.cart" :total="order.total" readonly />
  </main>
  <main v-else class="px-8 py-12 text-center">
    <p v-if="loading" role="status" class="text-muted">Consultando pedido…</p>
    <template v-else>
      <h1 class="text-2xl font-semibold">
        {{ notFound ? 'Pedido não encontrado' : 'Não foi possível consultar o pedido' }}
      </h1>
      <p role="alert" class="mt-3 text-sm text-muted">
        {{ notFound ? 'Confira o link informado. Este pedido não existe no servidor.' : error }}
      </p>
      <button
        v-if="!notFound"
        type="button"
        class="mt-6 text-sm underline underline-offset-4"
        @click="refresh"
      >
        Tentar novamente
      </button>
      <RouterLink :to="{ name: 'home' }" class="mt-6 block text-sm underline underline-offset-4"
        >Voltar à Home</RouterLink
      >
    </template>
  </main>
</template>
