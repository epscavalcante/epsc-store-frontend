<script setup lang="ts">
import { nextTick, onMounted, ref, toRefs } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'
import { useCheckout } from '@/composables/useCheckout'
import { checkoutDraft, resetPaymentDraft } from '@/checkout/draft'
import { checkoutRequest } from '@/checkout/service'
import { validatePayment } from '@/checkout/validation'
import { recentOrderIds } from '@/checkout/orders'
import type { FieldErrors } from '@/checkout/types'
import OrderSummary from '@/components/OrderSummary.vue'
import StoreIcon from '@/components/StoreIcon.vue'

const router = useRouter()
const cartStore = useCartStore()
const catalog = useProductsStore()
const { creating, error, fieldErrors, create } = useCheckout()
const { method, fields } = toRefs(checkoutDraft)
const errors = ref<FieldErrors>({})
const form = ref<HTMLFormElement>()
const methods = [
  { id: 'pix' as const, label: 'Pix', icon: 'pix' },
  { id: 'bankslip' as const, label: 'Boleto', icon: 'barcode' },
]
onMounted(() => {
  void catalog.load()
})
function changeQuantity(id: string, change: number) {
  if (change > 0) cartStore.increaseQuantity(id)
  else cartStore.decreaseQuantity(id)
}
async function submit() {
  if (creating.value || cartStore.locked || cartStore.isEmpty || !catalog.loaded) return
  errors.value = validatePayment(method.value, fields.value)
  if (Object.keys(errors.value).length) {
    await nextTick()
    form.value?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
    return
  }
  cartStore.locked = true
  try {
    const paymentMethod = method.value
    const result = await create(
      checkoutRequest(paymentMethod, cartStore.items, fields.value.name, fields.value.taxId),
    )
    if (!result) {
      errors.value = fieldErrors.value
      return
    }
    cartStore.clear()
    resetPaymentDraft()
    await router.push({ name: 'order', params: { id: result.id } })
    if (result.status === 'pending') {
      toast.info('Pedido criado. Falta realizar o pagamento.', {
        id: `checkout-${result.id}`,
        duration: 8000,
        description:
          paymentMethod === 'pix'
            ? 'Escaneie o QR Code ou copie o código Pix para pagar antes do prazo de expiração.'
            : 'Copie o código de barras ou abra o boleto para pagar até o vencimento.',
      })
    } else {
      toast.success('Pedido criado.', { id: `checkout-${result.id}` })
    }
  } finally {
    cartStore.locked = false
  }
}
</script>

<template>
  <main>
    <p v-if="catalog.loading" role="status" class="px-8 py-12 text-center text-muted">
      Carregando seu carrinho…
    </p>
    <section v-else-if="catalog.error" class="px-8 py-12 text-center" role="alert">
      <h1 class="text-2xl font-semibold">Não foi possível carregar os produtos.</h1>
      <p class="mt-3 text-sm text-danger">{{ catalog.error }}</p>
      <button
        class="mt-5 text-sm underline underline-offset-4"
        type="button"
        @click="catalog.load(true)"
      >
        Tentar novamente
      </button>
    </section>
    <div
      v-else-if="!cartStore.isEmpty"
      class="grid grid-cols-[1.08fr_1fr] items-stretch max-checkout:grid-cols-1"
    >
      <section
        class="min-w-0 px-12 pt-[42px] pb-[35px] max-wide:px-8 max-wide:pt-10 max-wide:pb-8 max-checkout:row-start-2 max-checkout:px-6 max-checkout:py-[30px] max-narrow:px-[18px]"
      >
        <h1 class="text-[28px] font-[650] tracking-[-1.1px]">Finalize seu pedido.</h1>
        <p class="mt-3 text-sm leading-relaxed text-muted">
          {{ cartStore.itemCount }}
          {{ cartStore.itemCount === 1 ? 'item no carrinho' : 'itens no carrinho' }}. Confira o
          pedido e escolha como pagar.
        </p>
        <RouterLink
          :to="{ name: 'home' }"
          class="mt-3 mb-8 inline-block text-xs underline underline-offset-4"
          >Adicionar mais produtos</RouterLink
        >
        <h2 class="mb-4 text-[17px] font-semibold">Forma de pagamento</h2>
        <form ref="form" novalidate :aria-busy="creating" @submit.prevent="submit">
          <fieldset class="grid grid-cols-2 gap-3" :disabled="cartStore.locked">
            <legend class="sr-only">Método de pagamento</legend>
            <label
              v-for="option in methods"
              :key="option.id"
              class="relative flex cursor-pointer flex-col gap-4 rounded-md border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
              :class="
                method === option.id
                  ? 'border-action bg-control-selected'
                  : 'border-stroke bg-control'
              "
            >
              <input
                v-model="method"
                type="radio"
                name="payment-method"
                :value="option.id"
                class="absolute top-4 right-4 accent-action"
                @change="errors = {}"
              />
              <StoreIcon :name="option.icon" :size="20" /><span class="text-sm">{{
                option.label
              }}</span>
            </label>
          </fieldset>
          <div
            v-if="method === 'pix'"
            class="my-6 rounded-md border border-stroke bg-control-selected p-5"
          >
            <h3 class="text-sm font-semibold">Pague com Pix</h3>
            <p class="mt-2 text-xs leading-relaxed text-muted">
              Depois de criar o pedido, você poderá acessar o QR Code e o código copia e cola na
              página do pedido.
            </p>
          </div>
          <fieldset v-else class="my-6 space-y-3" :disabled="cartStore.locked">
            <legend class="sr-only">Dados para boleto</legend>
            <p class="text-xs leading-relaxed text-muted">
              Informe os dados necessários para emitir o boleto.
            </p>
            <div>
              <label for="customer-name" class="mb-2 block text-xs font-medium"
                >Nome completo ou razão social</label
              >
              <input
                id="customer-name"
                v-model="fields.name"
                maxlength="100"
                autocomplete="name"
                :aria-invalid="!!errors.name"
                :aria-describedby="errors.name ? 'name-error' : undefined"
                class="w-full rounded-field border border-stroke-input bg-control p-3 text-sm aria-invalid:border-danger-border"
                placeholder="Seu nome"
              />
              <p v-if="errors.name" id="name-error" class="mt-2 text-xs text-danger">
                {{ errors.name }}
              </p>
            </div>
            <div>
              <label for="tax-id" class="mb-2 block text-xs font-medium">CPF ou CNPJ</label>
              <input
                id="tax-id"
                v-model="fields.taxId"
                maxlength="18"
                inputmode="numeric"
                autocomplete="off"
                :aria-invalid="!!errors.taxId"
                :aria-describedby="errors.taxId ? 'tax-error' : undefined"
                class="w-full rounded-field border border-stroke-input bg-control p-3 text-sm aria-invalid:border-danger-border"
                placeholder="000.000.000-00"
              />
              <p v-if="errors.taxId" id="tax-error" class="mt-2 text-xs text-danger">
                {{ errors.taxId }}
              </p>
            </div>
          </fieldset>
          <p v-if="error" role="alert" class="mb-4 text-xs leading-relaxed text-danger">
            {{ error }} O carrinho foi mantido.
          </p>
          <button
            type="submit"
            :disabled="cartStore.locked"
            class="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-md bg-action px-5 py-4 text-sm font-medium text-inset hover:bg-action-hover disabled:opacity-60"
          >
            <span
              v-if="creating"
              class="size-4 animate-spin rounded-full border-2 border-inset/30 border-t-inset motion-reduce:animate-none"
            />
            {{ creating ? 'Criando pedido…' : 'Finalizar pedido'
            }}<StoreIcon v-if="!creating" name="arrow" :size="18" />
          </button>
          <p class="mt-3 text-center text-[11px] leading-relaxed text-subtle">
            O valor final e as instruções serão confirmados na página do pedido.
          </p>
        </form>
      </section>
      <OrderSummary
        :items="cartStore.items"
        :total="cartStore.subtotal"
        :disabled="cartStore.locked"
        @quantity="changeQuantity"
        @remove="cartStore.removeProduct"
      />
    </div>
    <section v-else class="px-6 py-16 text-center">
      <StoreIcon name="cart" :size="40" class="mx-auto mb-6 text-muted" />
      <h1 class="text-2xl font-semibold">Seu carrinho está vazio.</h1>
      <p class="mt-3 text-sm text-muted">Visite a Home e selecione os produtos da sua compra.</p>
      <RouterLink
        :to="{ name: 'home' }"
        class="mt-6 inline-block rounded-md bg-action px-5 py-3 text-sm font-medium text-inset"
        >Selecionar produtos na Home</RouterLink
      >
    </section>
    <p v-if="cartStore.persistenceError" role="status" class="px-8 pb-4 text-xs text-pending">
      {{ cartStore.persistenceError }}
    </p>
    <details v-if="recentOrderIds.length" class="border-t border-stroke px-8 py-5 text-xs">
      <summary class="text-muted">Voltar a um pedido anterior</summary>
      <ul class="mt-4 space-y-3">
        <li v-for="id in recentOrderIds" :key="id">
          <RouterLink
            :to="{ name: 'order', params: { id } }"
            class="break-all underline underline-offset-4"
            >{{ id }}</RouterLink
          >
        </li>
      </ul>
    </details>
  </main>
</template>
