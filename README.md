# EPSC Store - Frontend

Frontend Vue 3 + TypeScript, Tailwind CSS 4, Pinia e Zod, integrado à API da epsc-store.

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

No GitHub Pages, o workflow usa a variável de Actions `VITE_API_URL` do repositório ou do environment `github-pages` durante o build. Configure a URL pública completa da API, incluindo o prefixo somente se o backend usar um. O build falha se a variável estiver vazia.

## Organização

- `src/api/HttpClient.ts`: transporte com fetch, timeout e erros HTTP.
- `src/gateways/ProductsGateway.ts`: `GET /products` e normalização do catálogo.
- `src/gateways/CheckoutGateway.ts`: `POST /checkouts` e `GET /checkouts/:id`, com conversão dos contratos da API.
- `src/config/injectionKeys.ts`: interfaces injetadas com chaves tipadas; implementações registradas em `src/main.ts`.
- `src/stores/products.ts`: catálogo compartilhado, carregamento, cache em memória e erro.
- `src/stores/cart.ts`: produtos escolhidos, quantidades, totais e persistência local.
- `src/composables/useCheckout.ts`: criação, consulta, erro e atualização do pagamento. Usa `CheckoutGateway` via inject e não depende da store do carrinho.
- `src/checkout/schemas.ts`: schemas Zod por método de pagamento, validação de CPF/CNPJ e validade, normalização dos campos e tipos inferidos do formulário.

UUIDs do backend identificam os produtos. Valores recebidos em reais são convertidos para centavos na camada de gateways. Nome, preço e total dos pedidos vêm do backend. Como o catálogo não fornece imagens, a interface usa uma ilustração local genérica.

## Fluxo

A Home `/` busca os produtos reais. O checkout `/checkout` usa os itens da Pinia, permite alterar quantidades e remover produtos. Aceita Pix, boleto e cartão de crédito, conforme o contrato do backend. O cartão é pago em uma única cobrança, sem parcelamento.

Para cartão, o formulário valida os dados do cliente (nome, CPF/CNPJ, e-mail, telefone com DDD, CEP e número do endereço) e envia `credit_card` com `holder_name`, `number`, `expiry_month`, `expiry_year` e `ccv`. Número, telefone, CEP e documento são enviados sem formatação; mês, ano e CVV permanecem strings para preservar zeros à esquerda. A validade aceita o mês atual e rejeita cartões vencidos. O backend determina o IP do cliente. A confirmação do cartão depende do status retornado pela API; um pedido pendente continua aguardando confirmação.

Após criar o checkout, o carrinho é limpo e a interface abre `/pedidos/:id`. Os itens e pagamentos são consultados na API. Pix usa o código e imagem de QR retornados; boleto usa o código e link fornecidos pelo backend. Campos indisponíveis não recebem exemplos fictícios. Expiração vem do backend e não reinicia ao atualizar ou reabrir a página.

A consulta do pedido pendente é repetida a cada 15 segundos enquanto a página estiver visível. Existe atualização manual. Falhas de atualização preservam os últimos dados exibidos. `paid` é convertido em sucesso; estados desconhecidos são exibidos como informados pelo servidor, sem presumir aprovação.

O carrinho salva apenas UUIDs e quantidades em `epsc-store.cart.v2`, reconciliados após carregar o catálogo. O carrinho dos mocks antigos não é importado. O histórico local guarda apenas os últimos 20 IDs reais; status e instruções sempre vêm da API. Dados do cliente e do cartão ficam apenas na memória do formulário. Os dados do cartão são apagados ao sair do checkout, e todos os campos são limpos após criar o pedido.

O POST não é reenviado automaticamente. Em falha de conexão, o resultado da criação pode ser incerto; uma proteção completa contra duplicação exige suporte a idempotência no backend. Não existe endpoint para renovar o pagamento do mesmo pedido: “Refazer compra” restaura os produtos para criar um novo checkout.

```sh
npm run build  # tipos e build
npm test       # validação dos campos, contrato de envio e limpeza dos dados do cartão
```
