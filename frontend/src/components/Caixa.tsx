import { useState } from 'react'
import { DENOMINACOES, type Sabor } from '../types'
import { brl } from '../lib/format'
import { Cedula } from './Cedula'
import { Button, Eyebrow, Panel, Spinner } from './ui'

interface CaixaProps {
  sabores: Sabor[]
  busy: string | null
  onCredito: (denominacao: number) => void
  onCompra: (sabor: string, notaPaga: number, promocional: boolean) => void
}

// Preço promocional: -R$2, mínimo R$2 (Strategy do back-end)
function precoPromocional(base: number): number {
  return Math.max(base - 2, 2)
}

export function Caixa({ sabores, busy, onCredito, onCompra }: CaixaProps) {
  const [sabor, setSabor] = useState<string | null>(null)
  const [notaPaga, setNotaPaga] = useState<number | null>(null)
  const [promocional, setPromocional] = useState(false)

  const saborSel = sabores.find((s) => s.sabor === sabor) ?? null
  const podeComprar = sabor !== null && notaPaga !== null && busy === null

  return (
    <div className="flex flex-col gap-6">
      {/* Inserir crédito */}
      <Panel>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <Eyebrow>Inserir crédito · ENTRADA</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-bold text-cream">
              Insira uma cédula
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DENOMINACOES.map((d) => (
            <button
              key={d}
              onClick={() => onCredito(d)}
              disabled={busy !== null}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-3 transition-colors hover:border-crust/50 hover:bg-crust/10 disabled:cursor-not-allowed disabled:opacity-40"
              title={`Inserir R$ ${d}`}
            >
              <Cedula denominacao={d} size="md" />
              <span className="text-[10px] text-cream/50">
                {busy === `credito:${d}` ? <Spinner className="h-3 w-3" /> : 'inserir'}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {/* Comprar coxinha */}
      <Panel>
        <Eyebrow>Comprar · SAIDA</Eyebrow>
        <h2 className="mt-1 font-display text-xl font-bold text-cream">Escolha o sabor</h2>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {sabores.map((s) => {
            const ativo = s.sabor === sabor
            const promo = precoPromocional(s.precoBase)
            return (
              <button
                key={s.sabor}
                onClick={() => setSabor(s.sabor)}
                disabled={busy !== null}
                className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-40 ${
                  ativo
                    ? 'border-crust bg-crust/15'
                    : 'border-white/10 bg-white/5 hover:border-crust/40'
                }`}
              >
                <span className="font-display font-bold text-cream">{s.sabor}</span>
                <span className="readout text-sm text-crust">{brl(s.precoBase)}</span>
                {promocional && (
                  <span className="readout text-[11px] text-folha">promo {brl(promo)}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Cédula de pagamento */}
        <div className="mt-5">
          <Eyebrow>Cédula de pagamento · notaPaga</Eyebrow>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DENOMINACOES.map((d) => (
              <button
                key={d}
                onClick={() => setNotaPaga(d)}
                disabled={busy !== null}
                className={`flex items-center justify-center rounded-lg border py-2 transition-colors disabled:opacity-40 ${
                  notaPaga === d
                    ? 'border-crust bg-crust/15'
                    : 'border-white/10 bg-white/5 hover:border-crust/40'
                }`}
              >
                <Cedula denominacao={d} size="sm" />
              </button>
            ))}
          </div>
        </div>

        {/* Toggle promocional + Strategy preview */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
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

          {saborSel && (
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className={promocional ? 'text-cream/40 line-through' : 'text-crust'}>
                {brl(saborSel.precoBase)}
              </span>
              <span className="text-cream/40">→</span>
              <span className={promocional ? 'font-bold text-folha' : 'text-cream/40'}>
                {brl(precoPromocional(saborSel.precoBase))}
              </span>
            </div>
          )}
        </div>

        <Button
          onClick={() => podeComprar && onCompra(sabor!, notaPaga!, promocional)}
          disabled={!podeComprar}
          className="mt-4 w-full py-3 text-base"
        >
          {busy === 'compra' ? (
            <Spinner />
          ) : (
            <>
              Comprar {sabor ?? 'sabor'} pagando{' '}
              {notaPaga ? brl(notaPaga) : '—'}
            </>
          )}
        </Button>
      </Panel>
    </div>
  )
}
