# Prompt para uma IA construir o Front-End

Copie tudo abaixo da linha e cole no agente de IA que vai construir o front. Anexe também o
arquivo `docs/API.md` (ou deixe a API rodando para a IA buscar `http://localhost:5141/v3/api-docs`).

---

Você é um engenheiro front-end sênior. Construa, do zero e de forma **completa e funcional**, o
front-end de um sistema chamado **Banca de Coxinha (Caixa Eletrônico de Salgados)**. Este front
será usado em uma **apresentação acadêmica da disciplina de Design Patterns**, então o objetivo
não é só "funcionar": é **deixar visíveis as funcionalidades, os cálculos e as estratégias** que
o back-end executa.

## Contexto do sistema

É um caixa eletrônico que vende coxinhas. O cliente insere cédulas (vira saldo), compra coxinhas
(o preço é debitado e o troco é devolvido em cédulas físicas), pode trocar o sabor de uma compra
e desfazer a última operação. O caixa tem estoque físico de cédulas em 7 slots
(R$ 2, 5, 10, 20, 50, 100, 200) e o troco precisa ser composto com as cédulas disponíveis.

## Back-end (já pronto — NÃO altere)

- Base URL: `http://localhost:5141` (CORS liberado para `/api/**`).
- Contrato completo da API: leia o arquivo `docs/API.md` e/ou `GET http://localhost:5141/v3/api-docs` (OpenAPI).
- Toda comunicação é JSON. Não há token; o "login" só carrega o cliente pelo campo `login`.
- Clientes de seed: `cliente` (id 1) e `vip` (id 2). Sabores: FRANGO 8, CATUPIRY 10, CARNE 9, QUEIJO 6.
- Endpoints (use o `docs/API.md` para schemas exatos): login, cadastrar/listar/buscar cliente,
  inserir crédito, comprar, trocar sabor, desfazer (com filtro por `clienteIds` ou global),
  abastecer slot, listar slots, listar sabores, extrato.

## Stack sugerida

- **React + Vite + TypeScript + TailwindCSS** (preferencial). Se julgar melhor, pode usar um único
  `index.html` com JS puro — mas priorize uma UI organizada e clara.
- Sem backend próprio; consuma diretamente a API acima via `fetch`.
- Centralize as chamadas num módulo `api.ts` tipado (um método por endpoint).
- Trate e exiba os erros do back-end (formato `{ status, mensagem, timestamp }`), destacando a
  mensagem exata `Transação impossível: falta de cédulas específicas`.

## Telas / funcionalidades obrigatórias

1. **Seleção de cliente / Login**: login por nome, listar clientes existentes e cadastrar novo
   cliente (nome, login, saldo inicial). Mostrar saldo atual em destaque, sempre atualizado.
2. **Caixa (tela principal)**:
   - Botões das 7 cédulas para **inserir crédito**; ao inserir, anime/realce o aumento de saldo e
     do slot correspondente.
   - Grade de **sabores** com preço (vinda de `/api/caixa/sabores`).
   - Um **seletor da cédula de pagamento** (`notaPaga`) e um **toggle "Promocional"**.
   - Ação de **comprar**: exibir claramente o resultado — preço cobrado, **troco detalhado em
     cédulas** e novo saldo.
3. **Painel de cédulas do caixa**: mostrar os 7 slots com a quantidade atual (de `/api/caixa/slots`),
   atualizando a cada operação. Incluir ação de **abastecer** um slot.
4. **Extrato**: lista de movimentações (mais recente primeiro) com tipo (ENTRADA / SAIDA /
   ESTORNO), data/hora, valor da nota, sabor, valor e troco. A partir de uma compra (SAIDA), botões
   de **trocar sabor** e **desfazer**.

## FOCO: tornar visíveis os cálculos e as estratégias

Esta é a parte mais importante. A UI deve **explicar o que está acontecendo por baixo**:

- **Cálculo do troco**: ao comprar, mostre a conta `notaPaga − preço = troco` e renderize o troco
  como cédulas empilhadas (ex.: `R$10 ×1 + R$2 ×1`). Some visualmente para conferir que fecha o valor.
- **Regra da paridade (R$5)**: quando o troco for ímpar, evidencie que o sistema usou uma cédula
  de R$ 5 para ajustar a paridade (ex.: um selo "usou R$5 p/ paridade"). Bom caso de teste:
  comprar CARNE (R$9) pagando R$20 → troco R$11.
- **Troco impossível**: crie um cenário fácil de disparar (ex.: comprar CARNE pagando R$10 → troco
  R$1) e mostre o erro **400** com a mensagem exata, sem quebrar a tela.
- **Estratégia de preço (Strategy)**: com o toggle "Promocional", mostre lado a lado preço padrão
  vs preço promocional (−R$2, mínimo R$2) e deixe claro qual estratégia foi aplicada na compra.
- **Movimento real (não CRUD)**: mostre saldo e estoque de cédulas **antes e depois** de cada
  operação, para evidenciar que houve movimentação real.
- **Command / desfazer**: o botão "Desfazer" deve demonstrar o padrão Command — permita desfazer a
  última transação **global** e também **filtrando por cliente** (campo para informar `clienteIds`).
  Ao desfazer, mostre o ESTORNO gerado aparecendo no extrato e o saldo/estoque voltando.
- **Factory de sabores**: a grade de sabores é alimentada pela API; trate sabor inválido com o erro
  do back-end.
- Inclua um pequeno **painel didático** (lateral ou rodapé) que, a cada ação, mostre qual Design
  Pattern do back-end foi acionado: ex. "Comprar → Facade → Command → Strategy (preço) + Factory
  (sabor) + Calculadora de Troco". Isso é só rótulo informativo na UI, ligado à ação disparada.

## Requisitos de qualidade

- Layout limpo, responsivo, com feedback visual (loading, sucesso, erro) em cada ação.
- Estado sempre sincronizado: após qualquer operação, recarregue saldo, slots e extrato.
- Código organizado em componentes pequenos e um cliente de API tipado e reutilizável.
- Sem texto fixo de dados que vêm da API (sabores, slots, clientes são dinâmicos).
- README do front explicando como rodar (`npm install` / `npm run dev`) e apontando a base URL.

## Critério de aceite (roteiro de demonstração que deve funcionar)

1. Login como `cliente` → saldo R$ 0.
2. Inserir R$ 20 → saldo R$ 20, slot R$20 +1.
3. Comprar FRANGO (R$ 8) pagando R$ 20 → troco R$ 12 = R$10 ×1 + R$2 ×1; UI mostra a conta.
4. Comprar CARNE (R$ 9) pagando R$ 20 → troco R$ 11 com destaque para a cédula de R$ 5 (paridade).
5. Forçar troco impossível (CARNE pagando R$ 10) → erro 400 com a mensagem exata exibida.
6. Ativar "Promocional" e comparar o preço; comprar e ver a estratégia aplicada.
7. Trocar o sabor de uma compra → ver ESTORNO + nova SAIDA no extrato.
8. Desfazer última (global e por `clienteIds`) → ver o estorno e o estoque/saldo voltarem.

Entregue o projeto completo, pronto para `npm run dev`, consumindo a API em `http://localhost:5141`.
