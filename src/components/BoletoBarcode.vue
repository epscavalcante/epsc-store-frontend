<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import JsBarcode from 'jsbarcode'
import { boletoBarcode } from '@/checkout/boleto'

const props = defineProps<{ value: string }>()
const barcode = computed(() => boletoBarcode(props.value))
const svg = ref<SVGSVGElement | null>(null)
const failed = ref(false)

watch([barcode, svg, () => props.value], ([value, element]) => {
  failed.value = false
  if (!value || !element) return
  try {
    JsBarcode(element, value, {
      format: 'ITF',
      displayValue: true,
      text: props.value,
      fontSize: 18,
      textMargin: 8,
      width: 2,
      height: 70,
      margin: 16,
      background: '#ffffff',
      lineColor: '#000000',
    })
  } catch {
    failed.value = true
  }
}, { flush: 'post' })
</script>

<template>
  <div v-if="barcode" v-show="!failed" class="mt-4 rounded-field bg-white p-2">
    <svg
      ref="svg"
      role="img"
      aria-label="Código de barras do boleto"
      class="block h-auto w-full"
    />
  </div>
  <template v-if="!barcode || failed">
    <p class="mt-4 text-xs text-muted">
      Código de barras indisponível. Você pode copiar o código ou abrir o boleto.
    </p>
    <p class="mt-2 select-text font-mono text-xs [overflow-wrap:anywhere]">{{ value }}</p>
  </template>
</template>
