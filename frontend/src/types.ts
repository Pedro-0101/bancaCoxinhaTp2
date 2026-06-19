// Tipos do domínio — espelham os schemas de docs/API.md

export const DENOMINACOES = [2, 5, 10, 20, 50, 100, 200] as const
export type Denominacao = (typeof DENOMINACOES)[number]

export type TipoMovimentacao = 'ENTRADA' | 'SAIDA' | 'ESTORNO'

export interface Cliente {
  id: number
  nome: string
  login: string
  saldo: number
}

export interface CreditoResponse {
  movimentacaoId: number
  denominacao: number
  quantidadeSlot: number
  saldo: number
}

export interface TrocoItem {
  denominacao: number
  quantidade: number
}

export interface ItemCoxinha {
  sabor: string
  quantidade: number
  precoUnitario: number
}

export interface CompraResponse {
  movimentacaoId: number
  itens: ItemCoxinha[]
  preco: number
  pagamento: TrocoItem[]
  troco: TrocoItem[]
  trocoEmCredito: number
  saldo: number
}

export interface TrocaResponse {
  estornoId: number
  novaMovimentacaoId: number
  itens: ItemCoxinha[]
  preco: number
  troco: TrocoItem[]
  trocoEmCredito: number
  saldo: number
}

export interface Movimentacao {
  id: number
  dataHora: string
  tipoMovimentacao: TipoMovimentacao
  valorNota: number
  sabor: string | null
  quantidade: number
  valor: number
  pagamento: TrocoItem[]
  troco: TrocoItem[]
  movimentacaoOrigemId: number | null
  itens: ItemCoxinha[]
}

export interface Slot {
  denominacao: number
  quantidade: number
}

export interface Sabor {
  sabor: string
  precoBase: number
}

export interface AbastecerResponse {
  denominacao: number
  quantidade: number
}

// Formato de erro padrão do back-end
export interface ApiErrorBody {
  status: number
  mensagem: string
  timestamp: string
}

export class ApiError extends Error {
  status: number
  timestamp?: string
  constructor(body: ApiErrorBody) {
    super(body.mensagem)
    this.name = 'ApiError'
    this.status = body.status
    this.timestamp = body.timestamp
  }
}

export const MSG_TROCO_IMPOSSIVEL = 'Transação impossível: falta de cédulas específicas'
