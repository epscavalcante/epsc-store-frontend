import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/checkout', name: 'checkout', component: () => import('@/views/CheckoutView.vue') },
    { path: '/pedidos/:id', name: 'order', component: () => import('@/views/OrderView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/checkout' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
