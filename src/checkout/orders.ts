import { ref } from 'vue'
const storageKey = 'epsc-store.recent-orders.v1'
function read(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(value)
      ? value
          .filter((id): id is string => typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id))
          .slice(0, 20)
      : []
  } catch {
    return []
  }
}
export const recentOrderIds = ref<string[]>(read())
export function rememberOrder(id: string) {
  recentOrderIds.value = [id, ...recentOrderIds.value.filter((item) => item !== id)].slice(0, 20)
  // A successful API checkout never depends on localStorage availability.
  try {
    localStorage.setItem(storageKey, JSON.stringify(recentOrderIds.value))
  } catch {
    /* Optional history only. */
  }
}
