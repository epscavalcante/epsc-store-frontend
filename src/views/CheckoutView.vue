<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import OrderSummary from '@/components/OrderSummary.vue'
import StoreIcon from '@/components/StoreIcon.vue'
import { checkoutRequest, submitMockCheckout } from '@/checkout/service'
import { savedOrders, findOrder, saveOrder } from '@/checkout/orders'
import { checkoutDraft, resumeFailedOrder } from '@/checkout/draft'
import type { FieldErrors, PaymentMethod } from '@/checkout/types'
import { validatePayment } from '@/checkout/validation'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const { method, outcome } = toRefs(checkoutDraft)
const fields = checkoutDraft.fields
const processing = ref(false)
const errors = ref<FieldErrors>({})
const submissionError = ref('')
const retryOrder = computed(() => {
  const id = typeof route.query.retry === 'string' ? route.query.retry : ''
  const order = findOrder(id)
  return order?.status === 'error' ? order : null
})
watch(
  retryOrder,
  (order) => {
    if (order) resumeFailedOrder(order)
  },
  { immediate: true },
)
const form = ref<HTMLFormElement>()
const methods: { id: PaymentMethod; label: string; icon: string; note: string }[] = [
  { id: 'pix', label: 'Pix', icon: 'pix', note: 'Rápido e prático' },
  { id: 'bankslip', label: 'Boleto', icon: 'barcode', note: 'Boleto bancário' },
  { id: 'credit_card', label: 'Cartão', icon: 'card', note: 'Crédito demonstrativo' },
]
function selectMethod(value: PaymentMethod) {
  method.value = value
  errors.value = {}
  outcome.value = value === 'credit_card' ? 'success' : 'pending'
}
function changeQuantity(id: number, change: number) {
  if (processing.value) return
  if (change > 0) cartStore.increaseQuantity(id)
  else cartStore.decreaseQuantity(id)
}
async function submit() {
  if (processing.value || cartStore.locked || cartStore.isEmpty) return
  errors.value = validatePayment(method.value, fields)
  submissionError.value = ''
  if (Object.keys(errors.value).length) {
    await nextTick()
    form.value?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    return
  }
  processing.value = true
  cartStore.locked = true
  const orderedCart = cartStore.items.map(({ product, quantity }) => ({
    product: { ...product },
    quantity,
  }))
  try {
    const result = await submitMockCheckout(
      checkoutRequest(method.value, orderedCart, fields.name, fields.taxId),
      outcome.value,
    )
    const order = saveOrder(result, orderedCart, retryOrder.value)
    if (result.status !== 'error') {
      cartStore.clear()
      fields.number = ''
      fields.holder = ''
      fields.expiry = ''
      fields.securityCode = ''
    }
    await router.push({ name: 'order', params: { id: order.id } })
  } catch {
    submissionError.value =
      'Não foi possível salvar o pedido neste navegador. Verifique se o armazenamento local está disponível e tente novamente. Seus dados foram mantidos.'
  } finally {
    cartStore.locked = false
    processing.value = false
  }
}
</script>

<template>
  <main>
    <div
      v-if="!cartStore.isEmpty"
      class="grid grid-cols-[1.08fr_1fr] items-stretch max-checkout:grid-cols-1"
    >
      <section
        class="min-w-0 px-12 pt-[42px] pb-[35px] max-wide:px-8 max-wide:pt-10 max-wide:pb-8 max-checkout:row-start-2 max-checkout:px-6 max-checkout:py-[30px] max-narrow:px-[18px]"
        aria-labelledby="payment-title"
      >
        <div class="mb-[34px] max-checkout:mb-7 [&_p]:text-sm [&_p]:leading-[1.6] [&_p]:text-muted">
          <h1
            class="mb-[9px] text-[28px] font-[650] leading-tight tracking-[-1.1px] max-narrow:text-[26px]"
            id="checkout-title"
            tabindex="-1"
          >
            Finalize seu pedido.
          </h1>
          <p>
            {{ cartStore.itemCount }}
            {{ cartStore.itemCount === 1 ? 'item no carrinho' : 'itens no carrinho' }}. Confira seu
            pedido e escolha como pagar.
          </p>
          <RouterLink
            :to="{ name: 'home' }"
            class="mt-3 inline-block text-xs text-action underline underline-offset-4"
            >Adicionar mais produtos</RouterLink
          >
        </div>

        <div class="mb-[17px]">
          <div>
            <h2 class="text-[17px] font-[650] tracking-[-.25px]" id="payment-title">
              Forma de pagamento
            </h2>
          </div>
        </div>
        <p
          v-if="retryOrder"
          class="mb-5 rounded-md border border-stroke bg-inset p-3 text-xs leading-relaxed text-muted"
        >
          Nova tentativa do pedido {{ retryOrder.id }}. Os produtos e quantidades foram restaurados.
          Após recarregar a página, preencha novamente os dados de pagamento.
        </p>
        <form ref="form" novalidate :aria-busy="processing" @submit.prevent="submit">
          <fieldset
            class="min-w-0 border-0 p-0 grid grid-cols-3 gap-2.5"
            :disabled="processing || cartStore.locked"
          >
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
            :disabled="processing || cartStore.locked"
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
            :disabled="processing || cartStore.locked"
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
                <label class="mb-[7px] block text-xs font-medium" for="card-expiry">Validade</label
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
            :disabled="processing || cartStore.locked"
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
              :disabled="processing || cartStore.locked"
            >
              <option value="pending">Pagamento pendente</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
            </select>
            <p>Escolha o resultado que deseja simular. Nenhuma cobrança real.</p>
          </details>
        </form>
      </section>
      <OrderSummary
        :items="cartStore.items"
        :total="cartStore.subtotal"
        :disabled="processing || cartStore.locked"
        @quantity="changeQuantity"
        @remove="cartStore.removeProduct"
      />
    </div>

    <section v-else class="px-6 py-16 text-center" aria-labelledby="empty-cart-title">
      <div
        class="mx-auto mb-6 grid size-20 place-items-center rounded-full border border-stroke bg-panel text-muted"
      >
        <StoreIcon name="cart" :size="36" />
      </div>
      <h1 id="empty-cart-title" class="text-2xl font-semibold">Seu carrinho está vazio.</h1>
      <p class="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
        Visite a Home e adicione alguns produtos ao carrinho para continuar sua compra.
      </p>
      <RouterLink
        :to="{ name: 'home' }"
        class="mt-6 inline-flex rounded-md bg-action px-5 py-3 text-sm font-medium text-inset hover:bg-action-hover"
        >Selecionar produtos na Home</RouterLink
      >
    </section>
    <p v-if="cartStore.persistenceError" role="status" class="px-8 pb-4 text-xs text-pending">
      {{ cartStore.persistenceError }}
    </p>
    <div
      v-if="savedOrders.length"
      class="border-t border-stroke px-12 py-5 text-xs max-wide:px-8 max-checkout:px-6"
    >
      <details>
        <summary class="text-muted">Voltar a um pedido anterior ({{ savedOrders.length }})</summary>
        <ul class="mt-4 space-y-3">
          <li v-for="order in savedOrders" :key="order.id">
            <RouterLink
              :to="{ name: 'order', params: { id: order.id } }"
              class="flex flex-wrap justify-between gap-2 text-action underline underline-offset-4"
            >
              <span>{{ order.id }}</span
              ><span>{{
                order.status === 'pending'
                  ? 'Pendente'
                  : order.status === 'success'
                    ? 'Confirmado'
                    : 'Erro'
              }}</span>
            </RouterLink>
          </li>
        </ul>
        <p class="mt-4 text-[11px] text-subtle">Pedidos de teste salvos apenas neste navegador.</p>
      </details>
    </div>
  </main>
</template>
