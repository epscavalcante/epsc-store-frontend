<script setup lang="ts">
defineProps<{ name: string; size?: number }>()
const paths: Record<string, string> = {
  bag: 'M6 7h12l1 13H5L6 7Zm3 0V5a3 3 0 0 1 6 0v2',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 5v2',
  card: 'M3 5h18v14H3V5Zm0 5h18M7 15h4',
  pix: 'm12 3 9 9-9 9-9-9 9-9Zm-6 6h3l3 3 3-3h3M6 15h3l3-3 3 3h3',
  barcode: 'M3 5v14M6 5v14M10 5v14M12 5v14M16 5v14M18 5v14M21 5v14',
  check: 'm5 12 4 4L19 6',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  error: 'm8 8 8 8m0-8-8 8M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  refresh: 'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-1l1 6M4 12l1 6a8 8 0 0 0 14-1',
}
</script>
<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>
