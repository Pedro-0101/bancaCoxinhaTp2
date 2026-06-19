// Cliente HTTP tipado — um método por endpoint de docs/API.md.
// Toda comunicação é JSON; erros do back-end vêm como { status, mensagem, timestamp }.

import {
  ApiError,
  type AbastecerResponse,
  type Cliente,
  type CompraResponse,
  type CreditoResponse,
  type Movimentacao,
  type Sabor,
  type Slot,
  type TrocaResponse,
} from './types'

export const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5141'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    })
  } catch {
    // Falha de rede / back-end fora do ar
    throw new ApiError({
      status: 0,
      mensagem: `Não foi possível conectar ao back-end em ${BASE_URL}. Confira se a API está rodando.`,
      timestamp: new Date().toISOString(),
    })
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    if (data && typeof data === 'object' && 'mensagem' in data) {
      throw new ApiError(data)
    }
    throw new ApiError({
      status: res.status,
      mensagem: `Erro ${res.status}`,
      timestamp: new Date().toISOString(),
    })
  }
  return data as T
}

export const api = {
  // 1. Login
  login: (login: string) =>
    request<Cliente>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login }),
    }),

  // 2. Cadastrar cliente
  cadastrarCliente: (nome: string, login: string, saldoInicial = 0) =>
    request<Cliente>('/api/clientes', {
      method: 'POST',
      body: JSON.stringify({ nome, login, saldoInicial }),
    }),

  // 3. Listar clientes
  listarClientes: () => request<Cliente[]>('/api/clientes'),

  // 4. Perfil do cliente
  buscarCliente: (id: number) => request<Cliente>(`/api/clientes/${id}`),

  // 5. Inserir crédito (ENTRADA)
  inserirCredito: (clienteId: number, denominacao: number) =>
    request<CreditoResponse>('/api/caixa/credito', {
      method: 'POST',
      body: JSON.stringify({ clienteId, denominacao }),
    }),

  // 6. Comprar coxinha (SAIDA)
  comprar: (
    clienteId: number,
    itens: { sabor: string; quantidade: number }[],
    notasPagas: number[],
    promocional: boolean,
    trocoExato = false,
  ) =>
    request<CompraResponse>('/api/caixa/compra', {
      method: 'POST',
      body: JSON.stringify({ clienteId, itens, notasPagas, promocional, trocoExato }),
    }),

  // 7. Trocar sabor (ESTORNO + nova SAIDA)
  trocarSabor: (
    clienteId: number,
    movimentacaoId: number,
    saborAntigo: string,
    novoSabor: string,
    promocional: boolean,
  ) =>
    request<TrocaResponse>('/api/caixa/troca', {
      method: 'POST',
      body: JSON.stringify({ clienteId, movimentacaoId, saborAntigo, novoSabor, promocional }),
    }),

  // 8. Desfazer última transação (Command)
  desfazer: (clienteIds: number[]) =>
    request<Movimentacao>('/api/caixa/desfazer', {
      method: 'POST',
      body: JSON.stringify({ clienteIds }),
    }),

  // 9. Abastecer slot
  abastecer: (denominacao: number, quantidade: number) =>
    request<AbastecerResponse>('/api/caixa/abastecer', {
      method: 'POST',
      body: JSON.stringify({ denominacao, quantidade }),
    }),

  // 10. Estoque de cédulas
  listarSlots: () => request<Slot[]>('/api/caixa/slots'),

  // 11. Sabores disponíveis
  listarSabores: () => request<Sabor[]>('/api/caixa/sabores'),

  // 12. Extrato do cliente
  extrato: (clienteId: number) => request<Movimentacao[]>(`/api/extrato/${clienteId}`),
}
