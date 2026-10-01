<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import OrderSummary from '@/components/OrderSummary.vue'
import StoreIcon from '@/components/StoreIcon.vue'
import PendingPayment from '@/components/PendingPayment.vue'
import { findOrder } from '@/checkout/orders'
import { startNewPurchase, resumeFailedOrder } from '@/checkout/draft'
import { currency } from '@/checkout/types'

const route = useRoute()
const router = useRouter()
const result = computed(() => findOrder(String(route.params.id)))
const resultTitle = ref<HTMLHeadingElement>()
const methods = [
  { id: 'pix', label: 'Pix' },
  { id: 'bankslip', label: 'Boleto' },
  { id: 'credit_card', label: 'Cartão' },
]
const resultHeading = computed(() =>
  result.value?.status === 'success'
    ? 'Pedido confirmado!'
    : result.value?.status === 'error'
      ? 'Vamos tentar de novo?'
      : 'Aguardando pagamento',
)
const orderUrl = computed(
  () =>
    new URL(
      router.resolve({ name: 'order', params: { id: String(route.params.id) } }).href,
      window.location.origin,
    ).href,
)
const copied = ref(false)
const linkFeedback = ref('')
let feedbackTimeout: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(feedbackTimeout))
watch(
  result,
  async () => {
    await nextTick()
    resultTitle.value?.focus()
  },
  { immediate: true },
)
async function copyLink() {
  clearTimeout(feedbackTimeout)
  try {
    await navigator.clipboard.writeText(orderUrl.value)
    copied.value = true
    linkFeedback.value = 'Link copiado para a área de transferência.'
    feedbackTimeout = setTimeout(() => {
      copied.value = false
      linkFeedback.value = ''
    }, 3000)
  } catch {
    linkFeedback.value = 'Selecione o link acima e copie manualmente.'
  }
}
async function retry() {
  if (!result.value || result.value.status !== 'error') return
  resumeFailedOrder(result.value)
  await router.push({ name: 'checkout', query: { retry: result.value.id } })
}
async function newPurchase() {
  startNewPurchase()
  await router.push({ name: 'home' })
}
</script>

<template>
  <main v-if="result" class="grid grid-cols-[1.08fr_1fr] items-stretch max-checkout:grid-cols-1">
    <section
      class="min-w-0 px-12 pt-[42px] pb-[35px] max-wide:px-8 max-wide:pt-10 max-wide:pb-8 max-checkout:row-start-2 max-checkout:px-6 max-checkout:py-[30px] max-narrow:px-[18px]"
      aria-labelledby="result-title"
    >
      <span
        class="mb-6 grid size-[62px] place-items-center rounded-full"
        :class="
          result.status === 'success'
            ? 'bg-success-surface text-success'
            : result.status === 'error'
              ? 'bg-danger-surface text-danger'
              : 'bg-pending-surface text-pending'
        "
        ><StoreIcon
          :name="
            result.status === 'success' ? 'check' : result.status === 'error' ? 'error' : 'clock'
          "
          :size="34"
      /></span>
      <span class="mb-[13px] block text-[9px] tracking-[1.1px] text-muted">{{
        result.status === 'success'
          ? 'SUCESSO SIMULADO'
          : result.status === 'error'
            ? 'ERRO SIMULADO'
            : 'PAGAMENTO PENDENTE · SIMULAÇÃO'
      }}</span>
      <h2
        class="text-[26px] font-[650] tracking-[-.8px]"
        id="result-title"
        ref="resultTitle"
        tabindex="-1"
      >
        {{ resultHeading }}
      </h2>
      <p class="mt-3 mb-[22px] text-[13px] leading-[1.8] text-muted">
        {{
          result.status === 'success'
            ? 'Sua compra de teste foi concluída. Obrigado por experimentar a epsc-store.'
            : result.status === 'error'
              ? 'O pagamento simulado não foi concluído. Seus produtos e quantidades continuam aqui para uma nova tentativa.'
              : 'Seu pedido foi criado, mas o pagamento ainda não foi aprovado.'
        }}
      </p>
      <dl
        class="mb-[25px] border-t border-stroke pt-3 [&_div]:mt-3 [&_div]:flex [&_div]:justify-between [&_div]:gap-3 [&_div]:text-xs [&_dt]:text-muted [&_dd]:m-0 [&_dd]:font-medium"
      >
        <div>
          <dt>Pedido de teste</dt>
          <dd>{{ result.id }}</dd>
        </div>
        <div>
          <dt>Forma de pagamento</dt>
          <dd>{{ methods.find((option) => option.id === result?.payment_method)?.label }}</dd>
        </div>
        <div>
          <dt>Valor total</dt>
          <dd>{{ currency(result.total) }}</dd>
        </div>
      </dl>
      <div class="mb-6 rounded-md border border-stroke bg-inset p-4">
        <label for="order-link" class="mb-2 block text-xs font-medium"
          >Link para voltar a este pedido</label
        >
        <input
          id="order-link"
          :value="orderUrl"
          readonly
          class="w-full rounded-field border border-stroke-input bg-control p-2.5 text-xs text-muted"
        />
        <button
          type="button"
          class="mt-3 text-xs text-action underline underline-offset-4"
          @click="copyLink"
        >
          {{ copied ? 'Link copiado' : 'Copiar link do pedido' }}
        </button>
        <p role="status" class="mt-2 text-[11px] leading-relaxed text-subtle">
          {{ linkFeedback || 'Disponível neste navegador, mesmo após fechar a aba.' }}
        </p>
      </div>
      <PendingPayment
        v-if="result.status === 'pending'"
        :key="result.id"
        :method="result.payment_method"
        :expires-at="result.pixExpiresAt"
        :due-at="result.boletoDueAt"
      />
      <button
        v-if="result.status === 'error'"
        type="button"
        class="flex min-h-[54px] w-full items-center justify-center gap-[15px] rounded-md border border-action bg-action px-[18px] py-[15px] text-sm font-medium text-inset hover:bg-action-hover"
        @click="retry"
      >
        <StoreIcon name="refresh" :size="18" />Tentar novamente
      </button>
      <button
        type="button"
        :class="
          result.status === 'error'
            ? 'mx-auto mt-[18px] flex items-center justify-center gap-2 border-0 bg-transparent text-xs text-muted underline underline-offset-4'
            : 'flex min-h-[54px] w-full items-center justify-center gap-[15px] rounded-md border border-action bg-action px-[18px] py-[15px] text-sm font-medium text-inset transition-colors duration-150 hover:border-action-hover hover:bg-action-hover disabled:opacity-60 motion-reduce:transition-none'
        "
        @click="newPurchase"
      >
        <StoreIcon name="refresh" :size="18" />Iniciar nova compra de teste
      </button>
      <p class="mt-[13px] text-center text-[11px] leading-[1.7] text-subtle">
        Demonstração. Nenhuma cobrança foi realizada.
      </p>
    </section>
    <OrderSummary :items="result.cart" :total="result.total" readonly />
  </main>
  <main v-else class="px-8 py-12">
    <h1 class="text-2xl font-semibold">Pedido não encontrado</h1>
    <p class="mt-3 text-sm leading-relaxed text-muted">
      Este pedido não está salvo neste navegador. Os pedidos desta demonstração ficam disponíveis
      apenas no dispositivo em que foram criados.
    </p>
    <RouterLink
      :to="{ name: 'checkout' }"
      class="mt-6 inline-block text-sm text-action underline underline-offset-4"
      >Voltar ao checkout</RouterLink
    >
  </main>
</template>
