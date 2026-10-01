<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import StoreIcon from '@/components/StoreIcon.vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

const route = useRoute()
const cartStore = useCartStore()
</script>

<template>
  <Toaster
    theme="dark"
    position="top-right"
    close-button
    :duration="4000"
    container-aria-label="Notificações"
    :toast-options="{ closeButtonAriaLabel: 'Fechar notificação' }"
    :style="{
      '--normal-bg': 'var(--color-panel)',
      '--normal-text': 'var(--color-foreground)',
      '--normal-border': 'var(--color-stroke)',
    }"
  />
  <div
    class="mx-auto my-12 max-w-[1000px] overflow-hidden rounded-shell border border-stroke-outer bg-surface max-wide:mx-6 max-wide:my-8 max-checkout:mx-auto max-checkout:my-5 max-checkout:max-w-[560px] max-compact:m-0 max-compact:min-h-dvh max-compact:rounded-none max-compact:border-0"
  >
    <header
      class="flex min-h-[100px] items-center gap-[30px] border-b border-stroke px-12 py-[26px] max-wide:px-8 max-checkout:min-h-[84px] max-checkout:gap-5 max-checkout:p-6 max-narrow:gap-[15px] max-narrow:px-[18px] max-narrow:py-[22px]"
    >
      <div class="min-w-0 flex-1">
        <RouterLink
          class="inline-flex items-center gap-3 text-action no-underline"
          :to="{ name: 'home' }"
          aria-label="epsc-store, início"
        >
          <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-action text-panel">
            <StoreIcon name="bag" :size="23" />
          </span>
          <span class="flex flex-col gap-1">
            <span class="text-[22px] leading-none font-bold tracking-[-.7px] max-narrow:text-xl">
              epsc-store
            </span>
            <span class="text-[11px] leading-tight font-normal tracking-wide text-muted">
              Loja online
            </span>
          </span>
        </RouterLink>
      </div>
      <RouterLink
        v-if="route.name === 'home'"
        :to="{ name: 'checkout' }"
        class="relative ml-auto grid size-10 shrink-0 place-items-center rounded-md text-action transition-colors hover:bg-control motion-reduce:transition-none"
        :aria-label="`Carrinho com ${cartStore.productCount} produtos diferentes, ir para o checkout`"
        title="Ir para o checkout"
      >
        <StoreIcon name="cart" :size="23" />
        <span
          v-if="cartStore.productCount"
          class="absolute -top-1 -right-1 grid min-w-5 h-5 place-items-center rounded-full bg-action px-1 text-[10px] font-semibold text-inset"
          aria-hidden="true"
          >{{ cartStore.productCount }}</span
        >
      </RouterLink>
    </header>

    <RouterView :key="$route.fullPath" />

    <footer
      class="flex justify-between gap-4 border-t border-stroke px-11 py-5 text-[10px] leading-[1.7] text-subtle max-checkout:flex-col max-checkout:gap-1.5 max-checkout:px-6"
    >
      &copy; epsc-store
      <span>
        <a href="https://epscavalcante.dev" target="_blank">epscavalcante.dev</a> · epsc-store</span
      >
    </footer>
  </div>
</template>
