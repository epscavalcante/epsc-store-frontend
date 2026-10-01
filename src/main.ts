import './app.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { FetchHttpClient } from './api/HttpClient'
import { ProductsHttpGateway } from './gateways/ProductsGateway'
import { CheckoutHttpGateway } from './gateways/CheckoutGateway'
import { productsGatewayKey, checkoutGatewayKey } from './config/injectionKeys'

const app = createApp(App)

app.use(createPinia())
const http = new FetchHttpClient(import.meta.env.VITE_API_URL || '/api')
app.provide(productsGatewayKey, new ProductsHttpGateway(http))
app.provide(checkoutGatewayKey, new CheckoutHttpGateway(http))
app.use(router)

app.mount('#app')
