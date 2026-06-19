# API — Banca de Coxinha (Caixa Eletrônico de Salgados)

Documento de referência para construção de um **front-end** (Web ou Mobile) que consome este
back-end. Tudo é JSON. Não há autenticação por token: o "login" apenas carrega o perfil pelo
campo `login`.

## Conexão

- **Base URL:** `http://localhost:5141`
- **Content-Type:** `application/json` em toda requisição com body.
- **CORS:** liberado para qualquer origem em `/api/**` (ambiente de desenvolvimento).
- **Contrato OpenAPI legível por máquina:** `GET http://localhost:5141/v3/api-docs`
- **Swagger UI:** `http://localhost:5141/swagger-ui.html`

## Conceitos de domínio

- **Cliente:** possui `saldo` (carteira em R$).
- **SlotNota:** estoque físico de cédulas do caixa. 7 denominações fixas: **2, 5, 10, 20, 50, 100, 200**.
- **Movimentação:** registro imutável de cada operação. Campo `tipoMovimentacao` é um enum:
  - `ENTRADA` — inserção de crédito (cédula).
  - `SAIDA` — compra de coxinha.
  - `ESTORNO` — reversão de uma compra (gerada por troca ou desfazer).
- **Sabores** (criados sob demanda, não persistidos):

  | sabor (enviar em maiúsculas) | preço base |
  |------------------------------|------------|
  | `FRANGO` | 8.00 |
  | `CATUPIRY` | 10.00 |
  | `CARNE` | 9.00 |
  | `QUEIJO` | 6.00 |

## Regras de negócio (essenciais para a UI)

- **Inserir crédito:** insere uma cédula de valor X → `saldo += X` e o slot dessa cédula +1.
  Só aceita as 7 denominações válidas.
- **Comprar coxinha:** o cliente paga inserindo **uma ou mais cédulas** (`notasPagas`, ex.:
  `[5, 2, 2]`). O campo `itens` é uma lista de `{sabor, quantidade}` — permite comprar
  **múltiplos sabores diferentes** em uma única transação. A soma dos valores **deve cobrir o
  preço total** (senão erro 400). As cédulas entram no caixa; o troco (`total pago - precoTotal`)
  é devolvido em cédulas. **O que não puder ser devolvido em cédulas é creditado no `saldo`**
  do cliente (campo `trocoEmCredito` na resposta).
- **Troco:** composto pelas **maiores cédulas disponíveis primeiro** (backtracking; acha a
  combinação se existir, ex.: R$ 100 só com cédulas de R$ 5). Troco **ímpar exige uma cédula de
  R$ 5**. Sem cédulas para o valor exato, devolve o máximo possível e credita o restante no saldo.
- **Troca de sabores:** estorna a compra original e cria uma nova compra trocando o(s) item(ns)
  cujo sabor é igual a `saborAntigo` pelo `novoSabor`.
- **Desfazer:** desfaz a última transação (gera ESTORNO). Pode filtrar por cliente.
- **`promocional: true`** aplica R$ 2 de desconto no preço (mínimo R$ 2).

## Formato de erro (todas as falhas)

```json
{ "status": 400, "mensagem": "texto do erro", "timestamp": "2026-06-17T11:51:09.61" }
```

- `400` — regra de negócio, validação ou troco impossível.
- `404` — recurso não encontrado (cliente/movimentação inexistente).

---

## Endpoints

### 1. Login
`POST /api/auth/login`

Request:
```json
{ "login": "cliente" }
```
Response `200`:
```json
{ "id": 1, "nome": "Cliente Demo", "login": "cliente", "saldo": 0.00 }
```
Erros: `404` se o login não existir.

```bash
curl -X POST http://localhost:5141/api/auth/login \
  -H "Content-Type: application/json" -d '{"login":"cliente"}'
```

### 2. Cadastrar cliente
`POST /api/clientes`

Request (`saldoInicial` opcional, >= 0; default 0):
```json
{ "nome": "Joao Teste", "login": "joao", "saldoInicial": 0 }
```
Response `201`:
```json
{ "id": 3, "nome": "Joao Teste", "login": "joao", "saldo": 0.00 }
```
Erros: `400` se o `login` já existir.

### 3. Listar clientes
`GET /api/clientes`

Response `200`:
```json
[
  { "id": 1, "nome": "Cliente Demo", "login": "cliente", "saldo": 0.00 },
  { "id": 2, "nome": "Cliente VIP", "login": "vip", "saldo": 50.00 }
]
```

### 4. Perfil do cliente
`GET /api/clientes/{id}`

Response `200`: mesmo formato do login. Erros: `404`.

### 5. Inserir crédito (ENTRADA)
`POST /api/caixa/credito`

Request (`denominacao` deve ser 2, 5, 10, 20, 50, 100 ou 200):
```json
{ "clienteId": 1, "denominacao": 20 }
```
Response `200`:
```json
{ "movimentacaoId": 1, "denominacao": 20, "quantidadeSlot": 11, "saldo": 20.00 }
```
Erros: `404` cliente inexistente; `400` denominação inválida.

### 6. Comprar coxinha (SAIDA)
`POST /api/caixa/compra`

Request: `itens` é uma lista de `{sabor, quantidade}` — permite comprar múltiplos sabores em
uma única transação. `notasPagas` é uma lista de cédulas (a soma deve ser >= preço total).
`trocoExato` (opcional, default `false`): quando `true`, a compra só é concluída se houver
cédulas para o troco **exato**, senão retorna o erro "Transação impossível"; quando `false`,
devolve o máximo em cédulas e credita o resto no saldo.

Exemplo comprando uma coxinha de FRANGO (R$ 8) pagando com R$ 20:
```json
{ "clienteId": 1, "itens": [{"sabor": "FRANGO", "quantidade": 1}], "notasPagas": [20], "promocional": false, "trocoExato": false }
```
Exemplo pagando com várias cédulas (R$ 5 + R$ 2 + R$ 2 = R$ 9):
```json
{ "clienteId": 1, "itens": [{"sabor": "CARNE", "quantidade": 1}], "notasPagas": [5, 2, 2], "promocional": false }
```
Exemplo comprando múltiplos sabores em uma transação (2 FRANGO + 1 CATUPIRY = R$ 26):
```json
{ "clienteId": 1, "itens": [{"sabor": "FRANGO", "quantidade": 2}, {"sabor": "CATUPIRY", "quantidade": 1}], "notasPagas": [20, 10], "promocional": false }
```
Response `200` (`itens` = itens comprados agregados; `pagamento` = cédulas inseridas agregadas;
`trocoEmCredito` = parte do troco que não pôde ser devolvida em cédulas e foi creditada no saldo):
```json
{
  "movimentacaoId": 2,
  "itens": [ { "sabor": "FRANGO", "quantidade": 1, "precoUnitario": 8.00 } ],
  "preco": 8.00,
  "pagamento": [ { "denominacao": 20, "quantidade": 1 } ],
  "troco": [ { "denominacao": 10, "quantidade": 1 }, { "denominacao": 2, "quantidade": 1 } ],
  "trocoEmCredito": 0.00,
  "saldo": 0.00
}
```
Erros:
- `400` se a cédula não cobre o preço (ex.: pagar coxinha de R$ 10 com nota de R$ 5).
- `400` `Transação impossível: falta de cédulas específicas` quando `trocoExato: true` e o caixa
  não tem cédulas para o troco exato (transação revertida).
- `400` sabor inválido ou cédula com denominação inválida.
- `404` cliente inexistente.

### 7. Trocar sabor (ESTORNO + nova SAIDA)
`POST /api/caixa/troca`

Request (`movimentacaoId` = id de uma compra SAIDA anterior). `saborAntigo` indica qual(is)
item(ns) terão o sabor trocado; `novoSabor` é o novo sabor:
```json
{ "clienteId": 1, "movimentacaoId": 2, "saborAntigo": "FRANGO", "novoSabor": "QUEIJO", "promocional": false }
```
Response `200`:
```json
{
  "estornoId": 5,
  "novaMovimentacaoId": 6,
  "itens": [ { "sabor": "QUEIJO", "quantidade": 1, "precoUnitario": 6.00 } ],
  "preco": 6.00,
  "troco": [ { "denominacao": 10, "quantidade": 1 }, { "denominacao": 2, "quantidade": 2 } ],
  "trocoEmCredito": 0.00,
  "saldo": 20.00
}
```
Erros: `400` se a movimentação já foi estornada ou não é uma compra; `404` se não existir.

### 8. Desfazer última transação (Command)
`POST /api/caixa/desfazer`

Request (opcional). `clienteIds` preenchido → desfaz a última transação desses clientes;
lista vazia ou body ausente → última transação global:
```json
{ "clienteIds": [1] }
```
Response `200` (a movimentação de ESTORNO gerada):
```json
{
  "id": 5,
  "dataHora": "2026-06-17T11:51:09.61",
  "tipoMovimentacao": "ESTORNO",
  "valorNota": 20.00,
  "sabor": "FRANGO",
  "quantidade": 1,
  "valor": 8.00,
  "troco": [],
  "movimentacaoOrigemId": 2,
  "itens": [ { "sabor": "FRANGO", "quantidade": 1, "precoUnitario": 8.00 } ]
}
```
Erros: `400` se não há transação para desfazer (no filtro ou global).

### 9. Abastecer caixa (reabastecer slot)
`POST /api/caixa/abastecer`

Request:
```json
{ "denominacao": 2, "quantidade": 10 }
```
Response `200`:
```json
{ "denominacao": 2, "quantidade": 30 }
```
Erros: `400` denominação inválida ou quantidade não positiva.

### 10. Estoque de cédulas
`GET /api/caixa/slots`

Response `200`:
```json
[
  { "denominacao": 2, "quantidade": 20 },
  { "denominacao": 5, "quantidade": 20 },
  { "denominacao": 10, "quantidade": 10 },
  { "denominacao": 20, "quantidade": 10 },
  { "denominacao": 50, "quantidade": 5 },
  { "denominacao": 100, "quantidade": 3 },
  { "denominacao": 200, "quantidade": 2 }
]
```

### 11. Sabores disponíveis
`GET /api/caixa/sabores`

Response `200`:
```json
[
  { "sabor": "FRANGO", "precoBase": 8.0 },
  { "sabor": "CATUPIRY", "precoBase": 10.0 },
  { "sabor": "CARNE", "precoBase": 9.0 },
  { "sabor": "QUEIJO", "precoBase": 6.0 }
]
```

### 12. Extrato do cliente
`GET /api/extrato/{clienteId}`

Response `200` (ordenado do mais recente para o mais antigo):
```json
[
  {
    "id": 3,
    "dataHora": "2026-06-17T11:44:57.81",
    "tipoMovimentacao": "ESTORNO",
    "valorNota": 20.00,
    "sabor": "FRANGO",
    "quantidade": 1,
    "valor": 8.00,
    "pagamento": [],
    "troco": [],
    "movimentacaoOrigemId": 2,
    "itens": [ { "sabor": "FRANGO", "quantidade": 1, "precoUnitario": 8.00 } ]
  },
  {
    "id": 2,
    "dataHora": "2026-06-17T11:44:57.75",
    "tipoMovimentacao": "SAIDA",
    "valorNota": 20.00,
    "sabor": "FRANGO",
    "quantidade": 1,
    "valor": 8.00,
    "pagamento": [ { "denominacao": 20, "quantidade": 1 } ],
    "troco": [ { "denominacao": 10, "quantidade": 1 }, { "denominacao": 2, "quantidade": 1 } ],
    "movimentacaoOrigemId": null,
    "itens": [ { "sabor": "FRANGO", "quantidade": 1, "precoUnitario": 8.00 } ]
  }
]
```
Erros: `404` cliente inexistente.

---

## Dados iniciais (seed)

- Clientes: `cliente` (id 1, saldo 0) e `vip` (id 2, saldo 50).
- Cédulas: 2→20, 5→20, 10→10, 20→10, 50→5, 100→3, 200→2.

## Telas sugeridas para o front

1. **Login / seleção de cliente** (consome 1, 2, 3, 4).
2. **Caixa** — botões de cédula para inserir crédito (5), grade de sabores com preço (11),
   ação de compra (6) exibindo o troco em cédulas, saldo em destaque.
3. **Painel de cédulas** — estoque dos 7 slots (10) e ação de abastecer (9).
4. **Extrato** — lista de movimentações com tipo, data/hora, valores e troco (12); ações de
   trocar sabor (7) e desfazer (8).

## Fluxo de exemplo (sequência de chamadas)

1. `POST /api/auth/login {"login":"cliente"}` → guarde `id`.
2. `POST /api/caixa/credito {"clienteId":1,"denominacao":20}`.
3. `POST /api/caixa/compra {"clienteId":1,"itens":[{"sabor":"FRANGO","quantidade":1}],"notasPagas":[20],"promocional":false}`.
4. `GET /api/extrato/1` para atualizar o histórico.
5. `POST /api/caixa/desfazer {"clienteIds":[1]}` para reverter.
