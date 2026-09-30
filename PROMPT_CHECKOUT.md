# Prompt — frontend da epsc-store

Implemente o frontend da epsc-store, uma mini loja destinada a validar o fluxo de checkout de um backend existente. O projeto está praticamente em branco e usa Vue 3, TypeScript e Vite. Vá direto à implementação.

## Objetivo

Criar uma experiência minimalista, visualmente agradável, com pequenos detalhes de refino. O foco do projeto é o backend; o frontend deve ser simples e fácil de usar.

## Fluxo

- O usuário abre diretamente o checkout, sem passar por catálogo.
- Selecione aleatoriamente de 2 a 3 produtos mockados ao iniciar.
- Preserve essa seleção durante a compra e nas tentativas após erro.
- Permita alterar as quantidades e escolher o método de pagamento.
- Ao finalizar, apresente um componente ou página de resultado.
- Inclua um botão para iniciar uma nova compra de teste, gerando outra seleção.

## Visual

Use como referência o checkout da Laravel Store/Shopify enviado na conversa:

- Cabeçalho discreto com a marca “epsc-store”.
- Desktop: formulário à esquerda e resumo do pedido à direita.
- Mobile: uma coluna, com produtos, formulário de pagamento e ação principal.
- Fotos ou ilustrações dos produtos, tipografia limpa, bastante espaço, bordas sutis e cantos levemente arredondados.
- Sem catálogo, banners, carrossel, login, newsletter, cupons ou navegação desnecessária.

## Paleta

- Fundo: `#F8F9FA`
- Cards e campos: `#FFFFFF`
- Bordas: `#DEE2E6`
- Texto principal: `#212529`
- Texto secundário: `#495057`
- Botão principal: `#212529` com texto branco
- Hover: `#343A40`

Use cores pontuais acompanhadas de texto ou ícones para sucesso, erro e pendente.

## Resumo do pedido

- Imagem pequena, nome e preço unitário de cada produto.
- Controles de quantidade com botões − e +.
- Quantidade mínima de 1.
- Subtotal por produto e total atualizados ao alterar quantidades.
- Formatação em reais e interface em português do Brasil.

## Pagamento

Inclua:

1. Pix.
2. Boleto: campos de nome e CPF/CNPJ.
3. Cartão de crédito demonstrativo: número, nome do titular, validade e código de segurança.

Mostre apenas os campos relevantes ao método selecionado. Não peça endereço ou outros dados desnecessários.

## Comportamento

- Botão “Finalizar pedido”.
- Estado de processamento, impedindo envios duplicados.
- Validação dos campos com mensagens claras.
- Resultados simulados de sucesso, erro e pagamento pendente.
- Erro: permita tentar novamente sem perder produtos, quantidades ou dados.
- Sucesso: mostre confirmação, identificador do pedido, valor e opção de nova compra.
- Pendente: mostre instruções apropriadas para Pix ou boleto.
- Identifique claramente o modo de demonstração e os pagamentos simulados.
- Disponibilize uma forma discreta de testar os diferentes resultados.
- Não realize cobranças reais nem persista dados de cartão.

## Dados e integração

Pode mockar todos os dados nesta primeira versão. Pode usar imagens da internet ou placeholders.

O backend existente oferece:

- `GET /products`: produtos com `id`, `name` e `price`.
- `POST /checkouts`: recebe `payment_method`, `items` com `product_id` e `quantity`, e `customer` com `name` e `tax_id` para boleto.
- Métodos implementados atualmente: `pix` e `bankslip`.
- Retorna pedido com `id`, `status`, `items` e `total`.
- Ainda não retorna QR Code ou informações do boleto, nem possui cartão implementado.

Nesta etapa, priorize o frontend funcional com mocks. Organize os dados e a lógica para facilitar a integração posterior. Na integração real, o backend deve confirmar preços e total; pendente não deve ser tratado como pagamento aprovado.

## Entrega

Implemente diretamente no projeto existente, sem prolongar a análise. Verifique o build e os tipos. Se houver ferramenta disponível, confira o layout no navegador e gere prints para revisão. Ao finalizar, informe o que foi criado, como executar e o que está mockado.
