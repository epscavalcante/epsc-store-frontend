<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { PaymentMethod } from '@/checkout/types'
import StoreIcon from './StoreIcon.vue'

defineProps<{ method: PaymentMethod }>()
const assetBase = import.meta.env.BASE_URL
// Deliberately non-payable examples. The QR encodes this same demonstration text.
const pixCode = 'DEMO-EPSC-STORE-PIX-SEM-VALOR-NAO-PAGAR'
const boletoCode = '00000.00000 00000.000000 00000.000000 0 00000000000000'
const expiresAt = Date.now() + 30 * 60 * 1000
const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
const remaining = ref(30 * 60)
const copied = ref<'pix' | 'boleto' | null>(null)
const copyError = ref('')
const timeLeft = computed(
  () =>
    `${String(Math.floor(remaining.value / 60)).padStart(2, '0')}:${String(remaining.value % 60).padStart(2, '0')}`,
)
let interval: ReturnType<typeof setInterval> | undefined
let feedbackTimeout: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  interval = setInterval(() => {
    remaining.value = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
    if (!remaining.value) clearInterval(interval)
  }, 1000)
})
onUnmounted(() => {
  clearInterval(interval)
  clearTimeout(feedbackTimeout)
})
async function copyCode(kind: 'pix' | 'boleto') {
  copied.value = null
  copyError.value = ''
  clearTimeout(feedbackTimeout)
  try {
    await navigator.clipboard.writeText(kind === 'pix' ? pixCode : boletoCode)
    copied.value = kind
    feedbackTimeout = setTimeout(() => {
      copied.value = null
    }, 3000)
  } catch {
    copyError.value =
      'Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente.'
  }
}
</script>

<template>
  <div class="mb-[26px]">
    <div v-if="method === 'bankslip'">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold">Seu boleto de exemplo</h3>
        <span
          class="rounded border border-[#4c565d] px-[7px] py-[3px] text-[9px] font-medium text-muted"
          >Simulado</span
        >
      </div>
      <p class="mt-[9px] mb-4 text-xs leading-[1.75] text-muted">
        Linha digitável e código de barras ilustrativos para experimentar o fluxo.
      </p>
      <div
        class="my-[18px] rounded-md bg-white px-2.5 py-[14px] [&_img]:block [&_img]:h-16 [&_img]:w-full"
      >
        <img
          :src="`${assetBase}payments/boleto-barcode.svg`"
          alt="Código de barras ilustrativo, sem validade para pagamento"
          width="320"
          height="64"
        />
      </div>
      <label class="mb-[7px] block text-xs font-medium" for="boleto-copy-code"
        >Linha digitável</label
      >
      <textarea
        id="boleto-copy-code"
        class="mb-2.5 block w-full resize-none rounded-field border border-stroke-input bg-inset p-3 font-mono text-[11px] leading-[1.7] text-[#dce2e7] [overflow-wrap:anywhere]"
        :value="boletoCode"
        readonly
        rows="2"
        spellcheck="false"
      />
      <button
        type="button"
        class="flex min-h-[42px] w-full items-center justify-center gap-[9px] rounded-field border border-[#59636b] bg-copy px-[14px] py-2.5 text-xs text-[#e5ebef] enabled:hover:bg-copy-hover disabled:opacity-50"
        @click="copyCode('boleto')"
      >
        <StoreIcon :name="copied === 'boleto' ? 'check' : 'barcode'" :size="16" />{{
          copied === 'boleto' ? 'Linha digitável copiada' : 'Copiar linha digitável'
        }}
      </button>
      <div
        class="mt-[14px] mb-[23px] flex flex-col gap-3 text-[11px] text-muted [&_strong]:font-medium [&_strong]:text-[#dce2e7] [&_a]:w-fit [&_a]:text-[#e0e7ed] [&_a]:underline [&_a]:underline-offset-4"
      >
        <span
          >Vencimento de exemplo: <strong>{{ dueDate }}</strong></span
        ><a :href="`${assetBase}payments/boleto-demo.pdf`" target="_blank" rel="noopener noreferrer"
          >Abrir PDF de exemplo ↗</a
        >
      </div>
    </div>

    <component
      :is="method === 'bankslip' ? 'details' : 'div'"
      v-if="method !== 'credit_card'"
      :class="method === 'bankslip' ? 'group rounded-md border border-[#3b454b] bg-[#24292b]' : ''"
    >
      <summary
        class="flex items-center gap-2 p-[14px] text-xs text-[#d1dbe0] after:ml-auto after:text-[17px] after:content-['+'] group-open:border-b group-open:border-[#3b454b] group-open:after:content-['−']"
        v-if="method === 'bankslip'"
      >
        <StoreIcon name="pix" :size="18" /> Prefere Pix? Veja a opção de exemplo
      </summary>
      <div :class="{ 'px-[14px] py-[18px]': method === 'bankslip' }">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold">
            {{ method === 'bankslip' ? 'Pix opcional' : 'Pague com Pix' }}
          </h3>
          <span
            class="rounded border border-[#4c565d] px-[7px] py-[3px] text-[9px] font-medium text-muted"
            >Simulado</span
          >
        </div>
        <p class="mt-[9px] mb-4 text-xs leading-[1.75] text-muted">
          Exemplo de QR Code e copia e cola. O QR contém apenas um texto de demonstração.
        </p>
        <div
          class="relative mx-auto mt-[19px] mb-3 w-[196px] rounded-lg bg-white p-3 [&_img]:block [&_img]:size-[172px]"
          :class="{ '[&_img]:opacity-[.12]': !remaining }"
        >
          <img
            :src="`${assetBase}payments/pix-demo.svg`"
            alt="QR Code de demonstração, sem valor para pagamento"
            width="172"
            height="172"
          /><span
            v-if="!remaining"
            class="absolute inset-0 grid place-items-center text-[13px] font-semibold text-panel"
            >Exemplo expirado</span
          >
        </div>
        <p
          class="mb-[23px] flex items-center justify-center gap-[7px] text-xs tabular-nums"
          :class="remaining ? 'text-[#d5c59c]' : 'text-danger'"
        >
          <StoreIcon name="clock" :size="15" />{{
            remaining ? `Expira em ${timeLeft}` : 'Prazo da simulação encerrado'
          }}
        </p>
        <label class="mb-[7px] block text-xs font-medium" for="pix-copy-code"
          >Pix copia e cola de exemplo</label
        >
        <textarea
          id="pix-copy-code"
          class="mb-2.5 block w-full resize-none rounded-field border border-stroke-input bg-inset p-3 font-mono text-[11px] leading-[1.7] text-[#dce2e7] [overflow-wrap:anywhere]"
          :value="pixCode"
          readonly
          rows="2"
          spellcheck="false"
        />
        <button
          type="button"
          class="flex min-h-[42px] w-full items-center justify-center gap-[9px] rounded-field border border-[#59636b] bg-copy px-[14px] py-2.5 text-xs text-[#e5ebef] enabled:hover:bg-copy-hover disabled:opacity-50"
          :disabled="!remaining"
          @click="copyCode('pix')"
        >
          <StoreIcon :name="copied === 'pix' ? 'check' : 'pix'" :size="16" />{{
            copied === 'pix' ? 'Código Pix copiado' : 'Copiar código Pix'
          }}
        </button>
        <p v-if="!remaining" class="mt-[9px] mb-4 text-xs leading-[1.75] text-muted">
          Inicie uma nova compra de teste para gerar outro prazo.
        </p>
      </div>
    </component>
    <p v-else class="mt-[9px] mb-4 text-xs leading-[1.75] text-muted">
      Aguardando processamento simulado do cartão.
    </p>
    <p role="status" class="mt-2.5 text-[11px] leading-[1.6] text-success empty:hidden">
      {{ copyError || (copied ? 'Copiado para a área de transferência.' : '') }}
    </p>
    <p
      class="mt-[19px] flex items-start gap-2 border-t border-stroke pt-[17px] text-[10px] leading-[1.8] text-subtle [&_svg]:mt-0.5 [&_svg]:shrink-0"
    >
      <StoreIcon name="lock" :size="15" /> QR Code, linha digitável e PDF são demonstrativos. Não
      realize pagamentos. O pedido permanece pendente.
    </p>
  </div>
</template>
