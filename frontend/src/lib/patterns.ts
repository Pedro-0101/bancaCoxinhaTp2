// Mapeamento didático: cada ação da UI → pipeline de Design Patterns no back-end.
// É só um rótulo informativo ligado à ação disparada, para a apresentação em aula.

export type AcaoTipo =
  | 'login'
  | 'cadastro'
  | 'credito'
  | 'compra'
  | 'troca'
  | 'desfazer'
  | 'abastecer'

export interface PatternStep {
  nome: string
  // Padrão GoF / papel arquitetural
  papel: string
}

export interface PatternPipeline {
  titulo: string
  resumo: string
  passos: PatternStep[]
}

export const PIPELINES: Record<AcaoTipo, PatternPipeline> = {
  login: {
    titulo: 'Carregar cliente',
    resumo: 'Busca o perfil pelo login e abre a sessão.',
    passos: [
      { nome: 'Repository', papel: 'acesso ao cliente' },
      { nome: 'Facade', papel: 'fachada do caixa' },
    ],
  },
  cadastro: {
    titulo: 'Cadastrar cliente',
    resumo: 'Cria um novo cliente com saldo inicial.',
    passos: [
      { nome: 'Facade', papel: 'fachada do caixa' },
      { nome: 'Repository', papel: 'persistência' },
    ],
  },
  credito: {
    titulo: 'Inserir crédito',
    resumo: 'A cédula entra no caixa: saldo += valor e o slot da nota +1.',
    passos: [
      { nome: 'Facade', papel: 'orquestra a operação' },
      { nome: 'Command', papel: 'ENTRADA registrada' },
      { nome: 'SlotNota', papel: 'estoque +1' },
    ],
  },
  compra: {
    titulo: 'Comprar coxinha',
    resumo: 'Calcula o preço, debita e devolve o troco em cédulas físicas.',
    passos: [
      { nome: 'Facade', papel: 'orquestra a operação' },
      { nome: 'Command', papel: 'SAIDA registrada' },
      { nome: 'Strategy', papel: 'preço (padrão/promocional)' },
      { nome: 'Factory', papel: 'cria o sabor' },
      { nome: 'Calculadora de Troco', papel: 'compõe as cédulas' },
    ],
  },
  troca: {
    titulo: 'Trocar sabor',
    resumo: 'Estorna a compra original e cria uma nova compra do novo sabor.',
    passos: [
      { nome: 'Facade', papel: 'orquestra a operação' },
      { nome: 'Command', papel: 'ESTORNO + nova SAIDA' },
      { nome: 'Strategy', papel: 'preço do novo sabor' },
      { nome: 'Factory', papel: 'cria o novo sabor' },
      { nome: 'Calculadora de Troco', papel: 'recompõe as cédulas' },
    ],
  },
  desfazer: {
    titulo: 'Desfazer última transação',
    resumo: 'Reverte a última operação gerando um ESTORNO.',
    passos: [
      { nome: 'Command', papel: 'undo() da última operação' },
      { nome: 'ESTORNO', papel: 'movimentação de reversão' },
      { nome: 'SlotNota', papel: 'estoque restaurado' },
    ],
  },
  abastecer: {
    titulo: 'Abastecer caixa',
    resumo: 'Recarrega manualmente um slot de cédulas.',
    passos: [
      { nome: 'Facade', papel: 'fachada do caixa' },
      { nome: 'SlotNota', papel: 'estoque += quantidade' },
    ],
  },
}
