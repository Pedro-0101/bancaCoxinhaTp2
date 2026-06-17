import { useEffect, useRef, useState } from 'react'
import { DENOMINACOES, type Slot } from '../types'
import { notaColor } from '../lib/format'
import { Button, Eyebrow, Spinner } from './ui'

interface SlotsPanelProps {
  slots: Slot[]
  busy: string | null
  onAbastecer: (denominacao: number, quantidade: number) => void
}

export function SlotsPanel({ slots, busy, onAbastecer }: SlotsPanelProps) {
  const [denom, setDenom] = useState<number>(2)
  const [qtd, setQtd] = useState('10')
  const prev = useRef<Record<number, number>>({})
  // diferença da última mudança por denominação (ex.: +1, -2), mostrada por alguns segundos
  const [deltas, setDeltas] = useState<Record<number, number>>({})

  useEffect(() => {
    const mudancas: Record<number, number> = {}
    for (const s of slots) {
      const anterior = prev.current[s.denominacao]
      if (anterior !== undefined && anterior !== s.quantidade) {
        mudancas[s.denominacao] = s.quantidade - anterior
      }
      prev.current[s.denominacao] = s.quantidade
    }
    if (Object.keys(mudancas).length) {
      setDeltas(mudancas)
      const t = window.setTimeout(() => setDeltas({}), 2800)
      return () => window.clearTimeout(t)
    }
  }, [slots])

  const ordenado = DENOMINACOES.map(
    (d) => slots.find((s) => s.denominacao === d) ?? { denominacao: d, quantidade: 0 },
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Eyebrow>Estoque de cédulas · SlotNota</Eyebrow>
        <h2 className="mt-1 font-display text-xl font-bold text-cream">Gaveta do caixa</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {ordenado.map((s) => {
          const delta = deltas[s.denominacao]
          const mudou = delta !== undefined
          const subiu = (delta ?? 0) > 0
          return (
            <div
              key={s.denominacao}
              className={`relative flex flex-col items-center gap-1 rounded-xl border bg-black/20 px-2 py-3 transition-all ${
                mudou
                  ? subiu
                    ? 'border-folha/70 bg-folha/10 ring-2 ring-folha/50'
                    : 'border-pimenta/70 bg-pimenta/10 ring-2 ring-pimenta/50'
                  : 'border-white/10'
              }`}
            >
              {mudou && (
                <span
                  className={`animate-drop absolute -right-1.5 -top-2 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-bold shadow ${
                    subiu ? 'bg-folha text-chassis' : 'bg-pimenta text-white'
                  }`}
                >
                  {subiu ? `+${delta}` : delta}
                </span>
              )}
              <span
                className="flex h-6 w-12 items-center justify-center rounded font-mono text-xs font-bold text-white/95"
                style={{
                  background: `linear-gradient(135deg, ${notaColor(s.denominacao)}, color-mix(in oklab, ${notaColor(s.denominacao)} 70%, black))`,
                }}
              >
                {s.denominacao}
              </span>
              <span
                key={s.quantidade}
                className={`readout text-lg font-bold ${
                  mudou ? 'animate-pop text-crust' : 'text-cream'
                }`}
              >
                {s.quantidade}
              </span>
              <span className="text-[10px] text-cream/40">cédulas</span>
            </div>
          )
        })}
      </div>

      {/* Abastecer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const q = Number(qtd)
          if (q > 0) onAbastecer(denom, q)
        }}
        className="flex flex-wrap items-end gap-2 border-t border-white/10 pt-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-cream/60">Denominação</span>
          <select
            value={denom}
            onChange={(e) => setDenom(Number(e.target.value))}
            disabled={busy !== null}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-cream focus:border-crust focus:outline-none disabled:opacity-40"
          >
            {DENOMINACOES.map((d) => (
              <option key={d} value={d}>
                R$ {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-cream/60">Quantidade</span>
          <input
            type="number"
            min="1"
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            disabled={busy !== null}
            className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 readout text-sm text-cream focus:border-crust focus:outline-none disabled:opacity-40"
          />
        </label>
        <Button type="submit" variant="ghost" disabled={busy !== null}>
          {busy === 'abastecer' ? <Spinner /> : 'Abastecer'}
        </Button>
      </form>
    </div>
  )
}
