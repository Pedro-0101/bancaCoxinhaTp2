import { useState, useEffect, useRef } from 'react'
import { DENOMINACOES, type Sabor } from '../types'
import { brl } from '../lib/format'
import { PIPELINES } from '../lib/patterns'
import { Cedula } from './Cedula'
import { Button, Eyebrow, Panel, Spinner } from './ui'
import type { PatternEvent } from './PatternPanel'

interface CaixaProps {
  sabores: Sabor[]
  busy: string | null
  events: PatternEvent[]
  onCompra: (itens: { sabor: string; quantidade: number }[], notasPagas: number[], promocional: boolean, trocoExato: boolean) => void
}

function precoPromocional(base: number): number {
  return Math.max(base - 2, 2)
}

function precoUnit(sabor: Sabor, promocional: boolean): number {
  return promocional ? precoPromocional(sabor.precoBase) : sabor.precoBase
}

type Passo = 1 | 2 | 3

const PASSOS: { num: Passo; label: string; desc: string }[] = [
  { num: 1, label: 'Sabores', desc: 'Escolha os sabores e veja o total' },
  { num: 2, label: 'Pagamento', desc: 'Selecione as cédulas' },
  { num: 3, label: 'Padrões', desc: 'Design Patterns no processo' },
]

function Chip({ nome, papel, dim }: { nome: string; papel: string; dim?: boolean }) {
  return (
    <span
      className={`group relative inline-flex flex-col rounded-none border px-2.5 py-1 ${
        dim
          ? 'border-white/10 bg-white/5 text-cream/70'
          : 'border-crust/40 bg-crust/15 text-cream'
      }`}
    >
      <span className="font-mono text-xs font-bold">{nome}</span>
      <span className="text-[10px] leading-tight text-cream/50">{papel}</span>
    </span>
  )
}

const DESCRICOES: Record<string, { titulo: string; descricao: string }> = {
  'Facade': {
    titulo: 'Facade — Fachada',
    descricao: 'Fornece uma interface unificada para o subsistema complexo do caixa. O Facade orquestra toda a operação de compra: valida os dados, chama o Command, aplica a Strategy de preço, usa a Factory para os sabores e aciona a Calculadora de Troco — tudo escondido atrás de uma única chamada.',
  },
  'Command': {
    titulo: 'Command — Comando',
    descricao: 'Encapsula a transação de compra como um objeto registrável. Cada SAIDA (venda) vira um comando que pode ser desfeito posteriormente via ESTORNO. É o que permite o botão "Desfazer": o sistema reverte a operação gerando um novo movimento de estorno que restaura saldo e estoque de cédulas.',
  },
  'Strategy': {
    titulo: 'Strategy — Estratégia',
    descricao: 'Permite trocar o algoritmo de precificação em tempo real. Duas estratégias estão disponíveis: a Normal (preço base do sabor) e a Promocional (desconto de R$ 2,00 por unidade, mínimo de R$ 2,00). O sistema seleciona automaticamente a estratégia conforme a escolha do usuário no passo 1.',
  },
  'Factory': {
    titulo: 'Factory — Fábrica',
    descricao: 'Desacopla a criação dos objetos "sabor" do resto do sistema. Cada sabor (FRANGO, CATUPIRY, CARNE, QUEIJO) é instanciado pela Factory, que centraliza a lógica de criação. Isso permite adicionar novos sabores sem modificar o código das operações de compra ou troca.',
  },
  'Calculadora de Troco': {
    titulo: 'Calculadora de Troco',
    descricao: 'Implementa um algoritmo de backtracking para compor o troco com as cédulas disponíveis no caixa. Tenta primeiro as cédulas de maior valor; se não formar o valor exato, recorre a combinações menores. Se o troco exato for impossível e a opção "Troco exato" estiver ativa, a transação é cancelada. Caso contrário, o máximo possível é dado em cédulas e o resto é creditado no saldo.',
  },
}

export function Caixa({ sabores, busy, events, onCompra }: CaixaProps) {
  const [passo, setPasso] = useState<Passo>(1)
  const [selecionados, setSelecionados] = useState<Record<string, number>>({})
  const [notasPagas, setNotasPagas] = useState<number[]>([])
  const [promocional, setPromocional] = useState(false)
  const [trocoExato, setTrocoExato] = useState(false)
  const prevEventsLen = useRef(events.length)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [autoPlay, setAutoPlay] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (events.length > prevEventsLen.current) {
      const latest = events[0]
      if (latest.acao === 'compra' && latest.ok) {
        setPasso(3)
      }
      prevEventsLen.current = events.length
    }
  }, [events])

  useEffect(() => {
    if (passo === 3) {
      const hasCompra = events.some(e => e.acao === 'compra' && e.ok)
      setActiveStep(hasCompra ? 0 : null)
      setAutoPlay(true)
    }
  }, [passo])

  useEffect(() => {
    if (!autoPlay || activeStep === null || activeStep >= PIPELINES['compra'].passos.length - 1) return

    const timer = setTimeout(() => {
      setActiveStep(prev => prev !== null ? prev + 1 : null)
    }, 4000)

    return () => clearTimeout(timer)
  }, [autoPlay, activeStep])

  const itens = Object.entries(selecionados).filter(([sabor]) => sabor).map(([sabor, q]) => ({ sabor, quantidade: q }))
  const totalPrice = itens.reduce((sum, item) => {
    const s = sabores.find((s) => s.sabor === item.sabor)
    return sum + (s ? precoUnit(s, promocional) * item.quantidade : 0)
  }, 0)
  const totalBase = itens.reduce((sum, item) => {
    const s = sabores.find((s) => s.sabor === item.sabor)
    return sum + (s ? s.precoBase * item.quantidade : 0)
  }, 0)
  const totalPago = notasPagas.reduce((s, n) => s + n, 0)
  const podeComprar = itens.length > 0 && notasPagas.length > 0 && busy === null

  function toggleSabor(sabor: string) {
    setSelecionados((prev) => {
      if (prev[sabor]) {
        const { [sabor]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [sabor]: 1 }
    })
  }

  function setQtd(sabor: string, qtd: number) {
    if (qtd <= 0) {
      setSelecionados((prev) => {
        const { [sabor]: _, ...rest } = prev
        return rest
      })
    } else {
      setSelecionados((prev) => ({ ...prev, [sabor]: qtd }))
    }
  }

  function adicionarNota(d: number) {
    setNotasPagas((prev) => [...prev, d])
  }

  function removerNota(idx: number) {
    setNotasPagas((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <Panel>
      {/* Step tabs */}
      <div className="flex gap-0 border-b border-white/10 mb-6">
        {PASSOS.map((p) => (
          <button
            key={p.num}
            onClick={() => setPasso(p.num)}
            className={`group flex-1 px-3 py-3 text-center font-display text-sm font-bold transition-all ${
              passo === p.num
                ? 'border-b-2 border-crust text-crust'
                : 'text-cream/40 hover:text-cream/70 border-b-2 border-transparent'
            }`}
          >
            <span
              className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                passo === p.num
                  ? 'bg-crust text-black'
                  : 'border border-cream/30 text-cream/40'
              }`}
            >
              {p.num}
            </span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {/* ========== PASSO 1: SABORES ========== */}
        {passo === 1 && (
          <div>
            <Eyebrow>Passo 1</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-bold text-cream">Escolha os sabores</h2>
            <p className="mt-1 text-xs text-cream/50">
              Selecione um ou mais sabores e ajuste as quantidades.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {sabores.map((s) => {
                const qtd = selecionados[s.sabor] ?? 0
                const unit = precoUnit(s, promocional)
                return (
                  <button
                    key={s.sabor}
                    onClick={() => toggleSabor(s.sabor)}
                    disabled={busy !== null}
                    className={`flex flex-col items-start rounded-none border px-3 py-2.5 text-left transition-colors disabled:opacity-40 ${
                      qtd > 0
                        ? 'border-crust bg-crust/15'
                        : 'border-white/10 bg-white/5 hover:border-crust/40'
                    }`}
                  >
                    <span className="font-display font-bold text-cream">{s.sabor}</span>
                    <span className="readout text-sm text-crust">{brl(s.precoBase)}</span>
                    {qtd > 0 && (
                      <span className="readout text-xs text-crust/60">{qtd} × {brl(unit)}</span>
                    )}
                    {promocional && (
                      <span className="readout text-[11px] text-folha">promo {brl(precoPromocional(s.precoBase))}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {itens.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 rounded-none border border-white/10 bg-black/20 px-4 py-3">
                <span className="text-xs text-cream/50">Quantidades:</span>
                {itens.map((item) => {
                  const s = sabores.find((s) => s.sabor === item.sabor)!
                  return (
                    <div key={item.sabor} className="flex items-center gap-3">
                      <span className="min-w-[7ch] font-display text-sm font-bold text-cream">
                        {item.sabor}
                      </span>
                      <button
                        onClick={() => setQtd(item.sabor, item.quantidade - 1)}
                        disabled={busy !== null}
                        className="flex h-7 w-7 items-center justify-center rounded-none border border-white/10 bg-white/5 font-mono text-base text-cream hover:bg-white/10 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="readout min-w-[2ch] text-center font-bold text-crust">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => setQtd(item.sabor, item.quantidade + 1)}
                        disabled={busy !== null}
                        className="flex h-7 w-7 items-center justify-center rounded-none border border-white/10 bg-white/5 font-mono text-base text-cream hover:bg-white/10 disabled:opacity-30"
                      >
                        +
                      </button>
                      <span className="ml-auto font-mono text-xs text-cream/60">
                        {brl(precoUnit(s, promocional))}/un
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total + Promo */}
            {itens.length > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-none border border-white/10 bg-black/30 px-4 py-2">
                <span className="font-mono text-xs text-cream/50">
                  {promocional ? (
                    <>
                      base <span className="text-cream/40 line-through">{brl(totalBase)}</span> → promo
                    </>
                  ) : (
                    'total'
                  )}
                </span>
                <span className="readout text-lg font-bold text-crust">{brl(totalPrice)}</span>
              </div>
            )}

            {/* Promo toggle */}
            <div className="mt-4">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="relative inline-flex h-6 w-11 items-center">
                  <input
                    type="checkbox"
                    checked={promocional}
                    disabled={busy !== null}
                    onChange={(e) => setPromocional(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-white/15 transition-colors peer-checked:bg-folha" />
                  <span className="absolute left-0.5 h-5 w-5 rounded-full bg-cream transition-transform peer-checked:translate-x-5" />
                </span>
                <span className="text-sm text-cream">
                  Promocional{' '}
                  <span className="text-cream/50">(Strategy: −R$2, mín. R$2)</span>
                </span>
              </label>
              {itens.length > 0 && !promocional && (
                <div className="flex items-center gap-2 font-mono text-xs text-cream/50 pt-2">
                  <span>Preço normal aplicado</span>
                </div>
              )}
              {itens.length > 0 && promocional && (
                <div className="flex items-center gap-3 font-mono text-sm pt-2">
                  <span className="text-cream/40 line-through">{brl(totalBase)}</span>
                  <span className="text-cream/40">→</span>
                  <span className="font-bold text-folha">{brl(totalPrice)}</span>
                  <span className="text-[10px] text-folha/60">economia de {brl(totalBase - totalPrice)}</span>
                </div>
              )}
            </div>

            <Button
              onClick={() => setPasso(2)}
              disabled={itens.length === 0}
              className="mt-5 w-full py-3 text-base"
            >
              Avançar para pagamento →
            </Button>
          </div>
        )}

        {/* ========== PASSO 2: PAGAMENTO ========== */}
        {passo === 2 && (
          <div>
            <Eyebrow>Passo 2</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-bold text-cream">Selecione as cédulas</h2>
            <p className="mt-1 text-xs text-cream/50">
              Clique nas cédulas para adicionar ao pagamento.
            </p>

            {/* Resumo do passo 1 */}
            {itens.length > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-none border border-white/10 bg-black/20 px-3 py-2">
                <span className="text-xs text-cream/60">
                  {itens.map(i => `${i.quantidade}x ${i.sabor}`).join(' + ')}
                </span>
                <span className="readout font-bold text-crust">{brl(totalPrice)}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {DENOMINACOES.map((d) => {
                const count = notasPagas.filter((n) => n === d).length
                return (
                  <button
                    key={d}
                    onClick={() => adicionarNota(d)}
                    disabled={busy !== null}
                    title={`Adicionar R$ ${d}`}
                    className={`relative flex items-center justify-center rounded-none border py-2 transition-colors disabled:opacity-40 ${
                      count > 0
                        ? 'border-crust bg-crust/15'
                        : 'border-white/10 bg-white/5 hover:border-crust/40'
                    }`}
                  >
                    <Cedula denominacao={d} size="sm" />
                    {count > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-crust font-mono text-[9px] font-bold text-black">
                        ×{count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {notasPagas.length > 0 && (
              <div className="mt-3 rounded-none border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {notasPagas.map((n, idx) => (
                    <button
                      key={idx}
                      onClick={() => removerNota(idx)}
                      disabled={busy !== null}
                      title="Remover esta nota"
                      className="flex items-center gap-1 rounded-none border border-crust/40 bg-crust/10 px-2 py-0.5 font-mono text-xs text-crust hover:border-pimenta/40 hover:bg-pimenta/15 disabled:opacity-40"
                    >
                      R$ {n} <span className="text-cream/50">×</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="font-mono text-xs text-cream/50">
                    total pago: <span className="font-bold text-cream">{brl(totalPago)}</span>
                    {totalPago >= totalPrice && (
                      <span className="ml-2 text-folha/70">troco: {brl(totalPago - totalPrice)}</span>
                    )}
                    {totalPago > 0 && totalPago < totalPrice && (
                      <span className="ml-2 text-pimenta/70">faltam {brl(totalPrice - totalPago)}</span>
                    )}
                  </span>
                  <button
                    onClick={() => setNotasPagas([])}
                    disabled={busy !== null}
                    className="font-mono text-[11px] text-pimenta/70 hover:text-pimenta disabled:opacity-40"
                  >
                    limpar
                  </button>
                </div>
              </div>
            )}

            {/* Troco exato toggle */}
            <div className="mt-4">
              <label className="flex cursor-pointer items-center gap-3">
                <span className="relative inline-flex h-6 w-11 items-center">
                  <input
                    type="checkbox"
                    checked={trocoExato}
                    disabled={busy !== null}
                    onChange={(e) => setTrocoExato(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-white/15 transition-colors peer-checked:bg-crust/60" />
                  <span className="absolute left-0.5 h-5 w-5 rounded-full bg-cream transition-transform peer-checked:translate-x-5" />
                </span>
                <span className="text-sm text-cream">
                  Troco exato{' '}
                  <span className="text-cream/50">(cancela se não houver cédulas exatas)</span>
                </span>
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="ghost" onClick={() => setPasso(1)} className="flex-1 py-3 text-base">
                ← Voltar
              </Button>
              <Button
                onClick={() => podeComprar && onCompra(itens, notasPagas, promocional, trocoExato)}
                disabled={!podeComprar}
                className="flex-1 py-3 text-base"
              >
                {busy === 'compra' ? (
                  <Spinner />
                ) : (
                  `Comprar por ${brl(totalPrice)}`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ========== PASSO 3: PADRÕES ========== */}
        {passo === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Eyebrow>Passo 3</Eyebrow>
                <h2 className="mt-1 font-display text-xl font-bold text-cream">
                  Pipeline de Design Patterns
                </h2>
              </div>
              {activeStep !== null && (
                <span className="font-mono text-[10px] text-cream/40">
                  {autoPlay ? '▶ reproduzindo...' : '⏸ pausado'}
                </span>
              )}
            </div>

            {events.length === 0 ? (
              <div className="mt-6 rounded-none border border-white/10 bg-black/20 p-6 text-center">
                <p className="text-sm text-cream/50">
                  Nenhuma compra realizada ainda.
                </p>
                <p className="mt-1 text-xs text-cream/40">
                  Volte ao passo 1, selecione sabores e efetue uma compra.
                </p>
              </div>
            ) : (
              <>
                {/* Pipeline visualization */}
                <div className="rounded-none border border-white/10 bg-black/15 p-4">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-3">
                    {PIPELINES['compra'].passos.map((p, i) => (
                      <div key={p.nome} className="flex items-center gap-1.5">
                        {i > 0 && <span className="font-mono text-crust/40">→</span>}
                        <button
                          onClick={() => {
                            setActiveStep(i)
                            setAutoPlay(false)
                          }}
                          className={`group relative inline-flex flex-col rounded-none border px-3 py-2 transition-all duration-300 cursor-pointer ${
                            activeStep === null
                              ? 'border-white/10 bg-white/5 text-cream/70'
                              : i < activeStep
                                ? 'border-folha/40 bg-folha/10 text-cream'
                                : i === activeStep
                                  ? 'border-crust bg-crust/20 text-cream shadow-[0_0_12px_rgba(255,206,0,0.15)]'
                                  : 'border-white/10 bg-white/5 text-cream/35'
                          }`}
                        >
                          <span className="font-mono text-xs font-bold">{p.nome}</span>
                          <span className="text-[10px] leading-tight text-cream/50">{p.papel}</span>
                          {activeStep !== null && i < activeStep && (
                            <span className="absolute -right-1 -top-1 text-[9px] text-folha">✓</span>
                          )}
                          {activeStep !== null && i === activeStep && (
                            <span className="absolute -right-1 -top-1 flex h-3 w-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crust opacity-75" />
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-crust" />
                            </span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {activeStep !== null && (
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-crust transition-all duration-500"
                          style={{ width: `${((activeStep + 1) / PIPELINES['compra'].passos.length) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-cream/40">
                        {activeStep + 1}/{PIPELINES['compra'].passos.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description of active pattern */}
                <div className="mt-4 min-h-[120px] rounded-none border border-crust/20 bg-crust/5 p-4">
                  {activeStep !== null && PIPELINES['compra'].passos[activeStep] ? (
                    (() => {
                      const passoAtual = PIPELINES['compra'].passos[activeStep]
                      const desc = DESCRICOES[passoAtual.nome]
                      return (
                        <div className="animate-rise">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-display font-bold text-crust">{desc.titulo}</span>
                            <span className="font-mono text-[10px] text-cream/40">{passoAtual.papel}</span>
                          </div>
                          <p className="text-sm text-cream/80 leading-relaxed">{desc.descricao}</p>
                        </div>
                      )
                    })()
                  ) : (
                    <p className="text-sm text-cream/50 text-center py-4">
                      Aguardando início da simulação...
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setAutoPlay(true)
                      if (activeStep === null || activeStep >= PIPELINES['compra'].passos.length - 1) {
                        setActiveStep(0)
                      }
                    }}
                    disabled={autoPlay && activeStep !== null && activeStep < PIPELINES['compra'].passos.length - 1}
                    className="flex items-center gap-1 px-3 py-1.5 font-mono text-[11px] text-crust/70 hover:text-crust border border-crust/30 hover:border-crust/60 transition-colors disabled:opacity-30"
                  >
                    ▶ Reproduzir
                  </button>
                  <button
                    onClick={() => setAutoPlay(false)}
                    disabled={!autoPlay}
                    className="flex items-center gap-1 px-3 py-1.5 font-mono text-[11px] text-cream/50 hover:text-cream border border-white/10 hover:border-white/30 transition-colors disabled:opacity-30"
                  >
                    ⏸ Pausar
                  </button>
                  <button
                    onClick={() => { setActiveStep(0); setAutoPlay(true) }}
                    className="flex items-center gap-1 px-3 py-1.5 font-mono text-[11px] text-cream/50 hover:text-cream border border-white/10 hover:border-white/30 transition-colors"
                  >
                    ↺ Reiniciar
                  </button>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button variant="ghost" onClick={() => setPasso(2)} className="flex-1 py-3 text-base">
                    ← Voltar ao pagamento
                  </Button>
                  <Button
                    onClick={() => { setPasso(1); setSelecionados({}); setNotasPagas([]); setPromocional(false); setTrocoExato(false) }}
                    variant="ghost"
                    className="flex-1 py-3 text-base"
                  >
                    Nova compra
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}
