<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { CheckoutPayment } from '@/checkout/types'
import StoreIcon from './StoreIcon.vue'

const props = defineProps<{ payment: CheckoutPayment }>()
const now = ref(Date.now())
const remaining = computed(() =>
  props.payment.expiresAt === null
    ? null
    : Math.max(0, Math.ceil((props.payment.expiresAt - now.value) / 1000)),
)
const expired = computed(() => remaining.value === 0 || props.payment.status === 'expired')
const unavailable = computed(() => expired.value || props.payment.status !== 'pending')
const timeLeft = computed(() => {
  const seconds = remaining.value ?? 0
  const hours = Math.floor(seconds / 3600)
  return `${hours ? `${hours}:` : ''}${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
})
const expiryDate = computed(() =>
  props.payment.expiresAt === null ? '' : new Date(props.payment.expiresAt).toLocaleString('pt-BR'),
)
const code = computed(() =>
  props.payment.method === 'pix' ? props.payment.pixCode : props.payment.bankslipCode,
)
const safeBoletoUrl = computed(() => {
  try {
    const url = new URL(props.payment.bankslipUrl ?? '')
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
})
const feedback = ref('')
const imageFailed = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  clearInterval(timer)
  clearTimeout(feedbackTimer)
})
async function copyCode() {
  if (!code.value || unavailable.value) return
  try {
    await navigator.clipboard.writeText(code.value)
    feedback.value = 'Código copiado.'
  } catch {
    feedback.value = 'Selecione os números acima e copie manualmente.'
  }
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = ''
  }, 3000)
}
</script>

<template>
  <section class="mb-6 rounded-md border border-stroke p-4">
    <h2 class="text-sm font-semibold">
      {{
        payment.method === 'pix'
          ? 'Pagamento com Pix'
          : payment.method === 'bankslip'
            ? 'Pagamento com boleto'
            : 'Pagamento'
      }}
    </h2>
    <p v-if="unavailable" class="mt-3 text-xs text-pending">
      {{
        expired
          ? 'O prazo deste pagamento expirou. Atualize o pedido para consultar a situação atual.'
          : `Status do pagamento: ${payment.rawStatus}.`
      }}
    </p>
    <template v-if="payment.method === 'pix'">
      <div
        v-if="payment.pixImage && !imageFailed"
        class="mx-auto my-5 w-[196px] rounded-lg bg-white p-3"
        :class="{ 'opacity-30': unavailable }"
      >
        <img
          :src="payment.pixImage"
          alt="QR Code do pagamento Pix"
          width="172"
          height="172"
          class="size-[172px]"
          @error="imageFailed = true"
        />
      </div>
      <p v-else class="mt-3 text-xs text-muted">
        QR Code indisponível. Use o código copia e cola, se disponível.
      </p>
      <p
        v-if="remaining !== null && !expired"
        class="my-4 flex items-center justify-center gap-2 text-xs text-pending tabular-nums"
      >
        <StoreIcon name="clock" :size="15" />Expira em {{ timeLeft }}
      </p>
    </template>
    <p v-if="expiryDate" class="my-3 text-xs text-muted">
      {{ payment.method === 'bankslip' ? 'Vencimento' : 'Validade' }}: {{ expiryDate }}
    </p>
    <template v-if="code">
      <label :for="`payment-code-${payment.id}`" class="mt-4 mb-2 block text-xs">
        {{ payment.method === 'pix' ? 'Pix copia e cola' : 'Código do boleto' }}
      </label>
      <textarea
        :id="`payment-code-${payment.id}`"
        :value="code"
        readonly
        rows="3"
        spellcheck="false"
        class="block w-full resize-none rounded-field border border-stroke-input bg-inset p-3 font-mono text-[11px] leading-relaxed text-action [overflow-wrap:anywhere]"
      />
      <button
        type="button"
        :disabled="unavailable"
        class="mt-3 flex w-full items-center justify-center gap-2 rounded-field border border-stroke-input bg-copy px-4 py-3 text-xs hover:bg-copy-hover disabled:opacity-50"
        @click="copyCode"
      >
        <StoreIcon :name="payment.method === 'pix' ? 'pix' : 'barcode'" :size="16" />Copiar código
      </button>
    </template>
    <p v-else class="mt-4 text-xs text-muted">Código de pagamento ainda não disponível.</p>
    <a
      v-if="payment.method === 'bankslip' && safeBoletoUrl && !unavailable"
      :href="safeBoletoUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-4 block text-xs underline underline-offset-4"
      >Abrir boleto ↗</a
    >
    <p role="status" class="mt-3 text-xs text-success empty:hidden">{{ feedback }}</p>
  </section>
</template>
