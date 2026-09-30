<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import OrderSummary from '@/components/OrderSummary.vue'
import StoreIcon from '@/components/StoreIcon.vue'
import PendingPayment from '@/components/PendingPayment.vue'
import { checkoutRequest, createCart, submitMockCheckout } from '@/checkout/service'
import { currency } from '@/checkout/types'
import type {
  CheckoutResult,
  CheckoutStatus,
  FieldErrors,
  PaymentFields,
  PaymentMethod,
} from '@/checkout/types'
import { validatePayment } from '@/checkout/validation'

const cart = ref(createCart())
const method = ref<PaymentMethod>('pix')
const outcome = ref<CheckoutStatus>('pending')
const processing = ref(false)
const result = ref<CheckoutResult | null>(null)
const errors = ref<FieldErrors>({})
const submissionError = ref('')
const fields = reactive<PaymentFields>({
  name: '',
  taxId: '',
  number: '',
  holder: '',
  expiry: '',
  securityCode: '',
})
const form = ref<HTMLFormElement>()
const resultTitle = ref<HTMLHeadingElement>()
const methods: { id: PaymentMethod; label: string; icon: string; note: string }[] = [
  { id: 'pix', label: 'Pix', icon: 'pix', note: 'Rápido e prático' },
  { id: 'bankslip', label: 'Boleto', icon: 'barcode', note: 'Boleto bancário' },
  { id: 'credit_card', label: 'Cartão', icon: 'card', note: 'Crédito demonstrativo' },
]
const resultHeading = computed(() =>
  result.value?.status === 'success'
    ? 'Pedido confirmado!'
    : result.value?.status === 'error'
      ? 'Vamos tentar de novo?'
      : 'Aguardando pagamento',
)

function selectMethod(value: PaymentMethod) {
  method.value = value
  errors.value = {}
  outcome.value = value === 'credit_card' ? 'success' : 'pending'
}
function changeQuantity(id: number, change: number) {
  if (processing.value) return
  const item = cart.value.find((item) => item.product.id === id)
  if (item) item.quantity = Math.min(99, Math.max(1, item.quantity + change))
}
async function submit() {
  if (processing.value) return
  errors.value = validatePayment(method.value, fields)
  submissionError.value = ''
  if (Object.keys(errors.value).length) {
    await nextTick()
    form.value?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    return
  }
  processing.value = true
  try {
    result.value = await submitMockCheckout(
      checkoutRequest(method.value, cart.value, fields.name, fields.taxId),
      outcome.value,
    )
    if (result.value.status !== 'error') {
      fields.number = ''
      fields.holder = ''
      fields.expiry = ''
      fields.securityCode = ''
    }
    await nextTick()
    resultTitle.value?.focus()
  } catch {
    submissionError.value =
      'Não foi possível finalizar o pedido. Seus dados foram mantidos. Tente novamente.'
  } finally {
    processing.value = false
  }
}
async function retry() {
  result.value = null
  await nextTick()
  form.value?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus()
}
async function newPurchase() {
  cart.value = createCart(cart.value.map((item) => item.product.id))
  result.value = null
  errors.value = {}
  submissionError.value = ''
  Object.assign(fields, {
    name: '',
    taxId: '',
    number: '',
    holder: '',
    expiry: '',
    securityCode: '',
  })
  method.value = 'pix'
  outcome.value = 'pending'
  await nextTick()
  document.getElementById('checkout-title')?.focus()
}
</script>

<template>
  <div
    class="mx-auto my-12 max-w-[1000px] overflow-hidden rounded-shell border border-stroke-outer bg-surface max-wide:mx-6 max-wide:my-8 max-checkout:mx-auto max-checkout:my-5 max-checkout:max-w-[560px] max-compact:m-0 max-compact:min-h-dvh max-compact:rounded-none max-compact:border-0"
  >
    <header
      class="flex min-h-[100px] items-center gap-[30px] border-b border-stroke px-12 py-[26px] max-wide:px-8 max-checkout:min-h-[84px] max-checkout:gap-5 max-checkout:p-6 max-narrow:gap-[15px] max-narrow:px-[18px] max-narrow:py-[22px]"
    >
      <a
        class="flex items-center text-[22px] font-bold tracking-[-.7px] text-action no-underline max-narrow:text-xl"
        :href="'.'"
        aria-label="epsc-store, início"
        ><span class="mr-3 grid size-[33px] place-items-center rounded-lg bg-action text-panel"
          ><StoreIcon name="bag" :size="21" /></span
        >epsc-store</a
      >
      <span
        class="rounded-[3px] border border-stroke px-[9px] py-1 text-[11px] text-[#b8c0c8] max-narrow:px-1.5 max-narrow:text-[10px]"
        >Modo demonstração</span
      >
    </header>
    <main>
      <div class="grid grid-cols-[1.08fr_1fr] items-stretch max-checkout:grid-cols-1">
        <section
          v-if="!result"
          class="min-w-0 px-12 pt-[42px] pb-[35px] max-wide:px-8 max-wide:pt-10 max-wide:pb-8 max-checkout:row-start-2 max-checkout:px-6 max-checkout:py-[30px] max-narrow:px-[18px]"
          aria-labelledby="payment-title"
        >
          <div
            class="mb-[34px] max-checkout:mb-7 [&_p]:text-sm [&_p]:leading-[1.6] [&_p]:text-muted"
          >
            <h1
              class="mb-[9px] text-[28px] font-[650] leading-tight tracking-[-1.1px] max-narrow:text-[26px]"
              id="checkout-title"
              tabindex="-1"
            >
              Finalize seu pedido.
            </h1>
            <p>Só mais um passo. Escolha como pagar.</p>
          </div>

          <div class="mb-[17px]">
            <div>
              <h2 class="text-[17px] font-[650] tracking-[-.25px]" id="payment-title">
                Forma de pagamento
              </h2>
            </div>
          </div>
          <form ref="form" novalidate :aria-busy="processing" @submit.prevent="submit">
            <fieldset class="min-w-0 border-0 p-0 grid grid-cols-3 gap-2.5" :disabled="processing">
              <legend class="sr-only">Método de pagamento</legend>
              <label
                v-for="option in methods"
                :key="option.id"
                class="relative flex cursor-pointer flex-col items-start gap-[14px] rounded-md border px-[13px] pt-[17px] pb-4 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus has-[:focus-visible]:outline-offset-3 motion-reduce:transition-none [&_input]:absolute [&_input]:top-[13px] [&_input]:right-[11px] [&_input]:m-0 [&_input]:size-3 [&_input]:appearance-none [&_input]:rounded-full [&_input]:border [&_input]:border-[#76818d] [&_input:checked]:border-4 [&_input:checked]:border-[#e4e8ec] [&_input:checked]:bg-[#262a2d] [&_svg]:size-[17px] [&_svg]:text-[#d4d9de] [&_strong]:text-sm [&_strong]:font-normal [&>span]:hidden"
                :class="
                  method === option.id
                    ? 'border-[#eef0f2] bg-control-selected'
                    : 'border-[#3b3f44] bg-control'
                "
              >
                <input
                  type="radio"
                  name="payment-method"
                  :value="option.id"
                  :checked="method === option.id"
                  @change="selectMethod(option.id)"
                />
                <StoreIcon :name="option.icon" :size="24" /><strong>{{ option.label }}</strong
                ><span>{{ option.note }}</span>
              </label>
            </fieldset>
            <div
              v-if="method === 'pix'"
              class="my-5 mb-[26px] rounded-md border border-stroke bg-[#242626] p-5 [&_p]:mt-[9px] [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:text-muted"
            >
              <div>
                <h3 class="text-sm font-semibold">Pague com Pix</h3>
                <p>
                  Após finalizar, você verá as instruções da simulação. Nenhuma transferência será
                  realizada.
                </p>
                <span
                  class="mt-[17px] block text-xs text-muted before:mr-2 before:inline-block before:align-middle before:text-lg before:content-['ϟ']"
                  >Simples, rápido e sem taxas.</span
                >
              </div>
            </div>
            <fieldset
              class="min-w-0 border-0 p-0 my-6 [&>label]:mt-4"
              v-else-if="method === 'bankslip'"
              :disabled="processing"
            >
              <legend class="sr-only">Dados para boleto</legend>
              <p class="mb-[19px] text-xs leading-[1.8] text-muted">
                Precisamos apenas dos dados de identificação para o boleto.
              </p>
              <label class="mb-[7px] block text-xs font-medium" for="customer-name"
                >Nome completo ou razão social</label
              ><input
                class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
                id="customer-name"
                v-model="fields.name"
                autocomplete="off"
                maxlength="100"
                placeholder="Ex.: Ana Silva"
                :aria-invalid="!!errors.name"
                :aria-describedby="errors.name ? 'name-error' : undefined"
              />
              <p
                v-if="errors.name"
                id="name-error"
                class="mt-1.5 mb-3 text-[11px] leading-normal text-danger"
              >
                {{ errors.name }}
              </p>
              <label class="mb-[7px] block text-xs font-medium" for="tax-id">CPF ou CNPJ</label
              ><input
                class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
                id="tax-id"
                v-model="fields.taxId"
                inputmode="numeric"
                autocomplete="off"
                maxlength="18"
                placeholder="000.000.000-00"
                :aria-invalid="!!errors.taxId"
                :aria-describedby="errors.taxId ? 'tax-error' : undefined"
              />
              <p
                v-if="errors.taxId"
                id="tax-error"
                class="mt-1.5 mb-3 text-[11px] leading-normal text-danger"
              >
                {{ errors.taxId }}
              </p>
            </fieldset>
            <fieldset
              class="min-w-0 border-0 p-0 my-6 [&>label]:mt-4"
              v-else
              :disabled="processing"
            >
              <legend class="sr-only">Cartão demonstrativo</legend>
              <p class="mb-[19px] text-xs leading-[1.8] text-muted">
                Use dados fictícios. Cartão de teste: <strong>4242 4242 4242 4242</strong>, validade
                futura e código 123.
              </p>
              <label class="mb-[7px] block text-xs font-medium" for="card-number"
                >Número do cartão</label
              ><input
                class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
                id="card-number"
                v-model="fields.number"
                autocomplete="off"
                inputmode="numeric"
                maxlength="23"
                placeholder="4242 4242 4242 4242"
                :aria-invalid="!!errors.number"
                :aria-describedby="errors.number ? 'number-error' : undefined"
              />
              <p
                v-if="errors.number"
                id="number-error"
                class="mt-1.5 mb-3 text-[11px] leading-normal text-danger"
              >
                {{ errors.number }}
              </p>
              <label class="mb-[7px] block text-xs font-medium" for="card-holder"
                >Nome do titular</label
              ><input
                class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
                id="card-holder"
                v-model="fields.holder"
                autocomplete="off"
                maxlength="100"
                placeholder="Nome impresso no cartão"
                :aria-invalid="!!errors.holder"
                :aria-describedby="errors.holder ? 'holder-error' : undefined"
              />
              <p
                v-if="errors.holder"
                id="holder-error"
                class="mt-1.5 mb-3 text-[11px] leading-normal text-danger"
              >
                {{ errors.holder }}
              </p>
              <div class="mt-4 grid grid-cols-2 gap-[14px] max-narrow:gap-2.5">
                <div>
                  <label class="mb-[7px] block text-xs font-medium" for="card-expiry"
                    >Validade</label
                  ><input
                    class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
                    id="card-expiry"
                    v-model="fields.expiry"
                    autocomplete="off"
                    inputmode="numeric"
                    maxlength="5"
                    placeholder="MM/AA"
                    :aria-invalid="!!errors.expiry"
                    :aria-describedby="errors.expiry ? 'expiry-error' : undefined"
                  />
                  <p
                    v-if="errors.expiry"
                    id="expiry-error"
                    class="mt-1.5 mb-3 text-[11px] leading-normal text-danger"
                  >
                    {{ errors.expiry }}
                  </p>
                </div>
                <div>
                  <label class="mb-[7px] block text-xs font-medium" for="card-code"
                    >Código de segurança</label
                  ><input
                    class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
                    id="card-code"
                    v-model="fields.securityCode"
                    type="password"
                    autocomplete="off"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="123"
                    :aria-invalid="!!errors.securityCode"
                    :aria-describedby="errors.securityCode ? 'code-error' : undefined"
                  />
                  <p
                    v-if="errors.securityCode"
                    id="code-error"
                    class="mt-1.5 mb-3 text-[11px] leading-normal text-danger"
                  >
                    {{ errors.securityCode }}
                  </p>
                </div>
              </div>
            </fieldset>
            <div
              class="mb-[18px] flex items-start gap-2 [&_svg]:mt-0.5 [&_svg]:w-[15px] [&_svg]:shrink-0 [&_svg]:text-subtle [&_p]:text-[10px] [&_p]:leading-[1.8] [&_p]:text-subtle [&_strong]:font-medium [&_strong]:text-[#c6cdd3]"
            >
              <StoreIcon name="lock" :size="18" />
              <p>
                <strong>Uma compra de teste, sem cobranças.</strong><br />Todos os pagamentos são
                simulados. Dados de cartão não são enviados nem armazenados.
              </p>
            </div>
            <p
              v-if="submissionError"
              role="alert"
              class="mt-1.5 mb-3 text-[11px] leading-normal text-danger"
            >
              {{ submissionError }}
            </p>
            <button
              class="flex min-h-[54px] w-full items-center justify-center gap-[15px] rounded-md border border-action bg-action px-[18px] py-[15px] text-sm font-medium text-inset transition-colors duration-150 hover:border-action-hover hover:bg-action-hover disabled:opacity-60 motion-reduce:transition-none"
              :disabled="processing"
              type="submit"
            >
              <span
                v-if="processing"
                class="size-4 animate-spin rounded-full border-2 border-[#20242755] border-t-inset [animation-duration:.8s] motion-reduce:animate-none"
              /><span>{{ processing ? 'Processando pedido…' : 'Finalizar pedido' }}</span
              ><template v-if="!processing"><StoreIcon name="arrow" :size="18" /></template>
            </button>
            <p class="mt-[13px] text-center text-[11px] leading-[1.7] text-subtle">
              {{
                processing
                  ? 'Aguarde um instante. Estamos simulando seu pagamento.'
                  : 'Tudo pronto para experimentar o checkout.'
              }}
            </p>
            <details
              class="mt-[30px] border-t border-stroke pt-[19px] text-[11px] text-subtle [&_summary]:w-fit [&_p]:mt-2 [&_p]:text-[10px] [&_p]:leading-[1.7] [&_label]:mt-[15px]"
            >
              <summary>Opções de teste</summary>
              <label class="mb-[7px] block text-xs font-medium" for="outcome"
                >Resultado da próxima tentativa</label
              ><select
                class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
                id="outcome"
                v-model="outcome"
                :disabled="processing"
              >
                <option value="pending">Pagamento pendente</option>
                <option value="success">Sucesso</option>
                <option value="error">Erro</option>
              </select>
              <p>Escolha o resultado que deseja simular. Nenhuma cobrança real.</p>
            </details>
          </form>
        </section>
        <section
          v-else
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
                result.status === 'success'
                  ? 'check'
                  : result.status === 'error'
                    ? 'error'
                    : 'clock'
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
                  ? 'O pagamento simulado não foi concluído. Seus produtos, quantidades e dados continuam aqui para uma nova tentativa.'
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
          <PendingPayment v-if="result.status === 'pending'" :method="result.payment_method" />
          <div v-if="result.status === 'error'" class="[&_select]:mb-[18px]">
            <label class="mb-[7px] block text-xs font-medium" for="retry-outcome"
              >Resultado da próxima tentativa</label
            ><select
              class="min-h-[43px] w-full rounded-field border border-stroke-input bg-control px-3 py-[11px] text-[13px] text-action placeholder:text-placeholder aria-invalid:border-danger-border disabled:opacity-60"
              id="retry-outcome"
              v-model="outcome"
            >
              <option value="pending">Pagamento pendente</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option></select
            ><button
              type="button"
              class="flex min-h-[54px] w-full items-center justify-center gap-[15px] rounded-md border border-action bg-action px-[18px] py-[15px] text-sm font-medium text-inset transition-colors duration-150 hover:border-action-hover hover:bg-action-hover disabled:opacity-60 motion-reduce:transition-none"
              @click="retry"
            >
              <StoreIcon name="refresh" :size="18" />Tentar novamente
            </button>
          </div>
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
        <OrderSummary
          :items="cart"
          :disabled="processing"
          :readonly="!!result"
          @quantity="changeQuantity"
        />
      </div>
    </main>
    <footer
      class="flex justify-between gap-4 border-t border-stroke px-11 py-5 text-[10px] leading-[1.7] text-subtle max-checkout:flex-col max-checkout:gap-1.5 max-checkout:px-6"
    >
      epsc-store<span class="mx-[7px] text-[#7d8790]">/</span>
      <span>Ambiente de teste · Simulação de checkout</span>
    </footer>
  </div>
</template>
