# EPSC Store - Frontend

Frontend Vue 3 + TypeScript, Tailwind CSS 4 e Pinia, integrado à API da epsc-store.

## Executar

```sh
npm install
npm run dev
```

O backend deve estar em `http://localhost:8000`. O Vite encaminha `/api/*` ao backend, evitando a necessidade de CORS em desenvolvimento. Reinicie o Vite ao mudar a configuração do proxy.

Configuração em `.env.example`:

- `VITE_API_URL`: prefixo de API usado pelo navegador, padrão `/api`.
- `VITE_API_PROXY_TARGET`: endereço do backend para o proxy de desenvolvimento.

Em produção, configure o servidor para encaminhar `/api` ao backend ou use `VITE_API_URL` com a URL pública da API e habilite CORS no backend. O servidor também deve encaminhar as rotas do frontend para `index.html`.

## Organização

- `src/api/HttpClient.ts`: transporte com fetch, timeout e erros HTTP.
- `src/gateways/ProductsGateway.ts`: `GET /products` e normalização do catálogo.
- `src/gateways/CheckoutGateway.ts`: `POST /checkouts` e `GET /checkouts/:id`, com conversão dos contratos da API.
- `src/config/injectionKeys.ts`: interfaces injetadas com chaves tipadas; implementações registradas em `src/main.ts`.
- `src/stores/products.ts`: catálogo compartilhado, carregamento, cache em memória e erro.
- `src/stores/cart.ts`: produtos escolhidos, quantidades, totais e persistência local.
- `src/composables/useCheckout.ts`: criação, consulta, erro e atualização do pagamento. Usa `CheckoutGateway` via inject e não depende da store do carrinho.

UUIDs do backend identificam os produtos. Valores recebidos em reais são convertidos para centavos na camada de gateways. Nome, preço e total dos pedidos vêm do backend. Como o catálogo não fornece imagens, a interface usa uma ilustração local genérica.

## Fluxo

A Home `/` busca os produtos reais. O checkout `/checkout` usa os itens da Pinia, permite alterar quantidades e remover produtos. Aceita Pix e boleto, conforme o contrato atual; cartão e resultados simulados foram retirados do fluxo integrado.

Após criar o checkout, o carrinho é limpo e a interface abre `/pedidos/:id`. Os itens e pagamentos são consultados na API. Pix usa o código e imagem de QR retornados; boleto usa o código e link fornecidos pelo backend. Campos indisponíveis não recebem exemplos fictícios. Expiração vem do backend e não reinicia ao atualizar ou reabrir a página.

A consulta do pedido pendente é repetida a cada 15 segundos enquanto a página estiver visível. Existe atualização manual. Falhas de atualização preservam os últimos dados exibidos. `paid` é convertido em sucesso; estados desconhecidos são exibidos como informados pelo servidor, sem presumir aprovação.

O carrinho salva apenas UUIDs e quantidades em `epsc-store.cart.v2`, reconciliados após carregar o catálogo. O carrinho dos mocks antigos não é importado. O histórico local guarda apenas os últimos 20 IDs reais; status e instruções sempre vêm da API. Nome e documento ficam apenas na memória do formulário.

O POST não é reenviado automaticamente. Em falha de conexão, o resultado da criação pode ser incerto; uma proteção completa contra duplicação exige suporte a idempotência no backend. Não existe endpoint para renovar o pagamento do mesmo pedido: “Refazer compra” restaura os produtos para criar um novo checkout.

```sh
npm run build  # tipos e build
```
