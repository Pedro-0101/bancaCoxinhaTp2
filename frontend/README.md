# Banca de Coxinha — Front-end

Front-end do **Caixa Eletrônico de Salgados**, feito para uma apresentação da disciplina de
**Design Patterns**. Além de operar o caixa (inserir cédulas, comprar coxinhas, trocar sabor,
desfazer), a interface **expõe os cálculos e os padrões** que o back-end executa em cada ação.

Stack: **React + Vite + TypeScript + TailwindCSS v4**.

## Como rodar

Pré-requisito: o back-end precisa estar no ar em `http://localhost:5141`
(CORS liberado para `/api/**`).

```bash
npm install
npm run dev
```

Abra o endereço que o Vite imprimir (por padrão `http://localhost:5173`).

Para apontar para outra URL de API, copie `.env.example` para `.env` e ajuste
`VITE_API_BASE_URL`.

Build de produção:

```bash
npm run build && npm run preview
```

## O que a interface mostra

- **Login / clientes** — entra por login, lista clientes existentes e cadastra novos.
  Seeds: `cliente` (saldo R$ 0) e `vip` (saldo R$ 50). O saldo fica sempre em destaque no topo.
- **Caixa** — botões das 7 cédulas para inserir crédito, grade de sabores (vinda da API),
  seletor da cédula de pagamento (`notaPaga`) e toggle **Promocional**.
- **Resultado da operação** — a cada compra/troca, mostra:
  - a conta `notaPaga − preço = troco`;
  - o **troco como cédulas físicas** (nas cores reais do Real) que **somam** até o valor;
  - selo **"usou R$5 p/ paridade"** quando o troco é ímpar;
  - **Strategy de preço**: padrão vs promocional, destacando a aplicada;
  - **antes → depois** de saldo e dos slots afetados (movimento real, não CRUD).
- **Gaveta do caixa** — os 7 slots de cédulas, com a quantidade piscando ao mudar, e
  ação de **abastecer**.
- **Extrato** — movimentações (ENTRADA / SAIDA / ESTORNO), com **trocar sabor** por compra e
  **desfazer** a última transação (global, do cliente atual, ou filtrando por `clienteIds`).
- **Painel "O que rodou por baixo"** — a cada ação, ilumina o pipeline de Design Patterns
  acionado (ex.: `Comprar → Facade → Command → Strategy + Factory + Calculadora de Troco`),
  com histórico das ações.

Erros do back-end (`{ status, mensagem, timestamp }`) aparecem como toast e no histórico de
padrões — incluindo a mensagem exata `Transação impossível: falta de cédulas específicas`,
sem quebrar a tela.

## Roteiro de demonstração

1. Entrar como `cliente` → saldo R$ 0.
2. Inserir R$ 20 → saldo R$ 20, slot R$ 20 +1.
3. Comprar **FRANGO** (R$ 8) pagando R$ 20 → troco R$ 12 = R$10 ×1 + R$2 ×1.
4. Comprar **CARNE** (R$ 9) pagando R$ 20 → troco R$ 11 com o selo de paridade (usa R$ 5).
5. Comprar **CARNE** pagando R$ 10 → troco R$ 1 → **erro 400** com a mensagem exata.
6. Ativar **Promocional** e comparar o preço antes de comprar.
7. **Trocar o sabor** de uma compra → ver ESTORNO + nova SAIDA no extrato.
8. **Desfazer** (global e por `clienteIds`) → ver o estorno e saldo/estoque voltarem.

## Estrutura

```
src/
  api.ts              Cliente HTTP tipado (um método por endpoint)
  types.ts            Tipos do domínio + ApiError
  lib/
    format.ts         BRL, datas, cor real das cédulas, soma/paridade do troco
    patterns.ts       Mapeamento ação -> pipeline de Design Patterns
  components/
    Caixa.tsx         Inserir crédito + comprar (Strategy preview)
    Cedula.tsx        Cédula do Real + pilha de troco
    Extrato.tsx       Movimentações + trocar sabor + desfazer
    OperationResult.tsx  Cálculo do troco, paridade, Strategy, antes->depois
    PatternPanel.tsx  Painel didático dos padrões
    SlotsPanel.tsx    Gaveta de cédulas + abastecer
    Toast.tsx, ui.tsx Feedback e primitivos de UI
  screens/Login.tsx   Login / seleção / cadastro de cliente
  App.tsx             Orquestra estado, operações e layout
```
