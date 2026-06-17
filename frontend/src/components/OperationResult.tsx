import type { Slot, TrocoItem } from '../types'
import { brl, somaTroco, usouParidade } from '../lib/format'
import { TrocoStack } from './Cedula'
import { Delta, Eyebrow } from './ui'

export interface OperationSnapshot {
  tipo: 'compra' | 'troca'
  sabor: string
  saborAnterior?: string
  notaPaga: number
  precoBase: number
  preco: number
  promocional: boolean
  troco: TrocoItem[]
  saldoAntes: number
  saldoDepois: number
  slotsAntes: Slot[]
  slotsDepois: Slot[]
}

function slotsAfetados(antes: Slot[], depois: Slot[]) {
  const mapAntes = new Map(antes.map((s) => [s.denominacao, s.quantidade]))
  return depois
    .filter((s) => (mapAntes.get(s.denominacao) ?? 0) !== s.quantidade)
    .map((s) => ({
      denominacao: s.denominacao,
      antes: mapAntes.get(s.denominacao) ?? 0,
      depois: s.quantidade,
    }))
}

export function OperationResult({ snap }: { snap: OperationSnapshot }) {
  const soma = somaTroco(snap.troco)
  const trocoEsperado = snap.notaPaga - snap.preco
  const fecha = Math.abs(soma - trocoEsperado) < 0.001
  const paridade = usouParidade(snap.troco)
  const slots = slotsAfetados(snap.slotsAntes, snap.slotsDepois)

  return (
    <div className="animate-drop flex flex-col gap-4 rounded-xl border border-crust/30 bg-black/25 p-4">
      <div className="flex items-center justify-between">
        <Eyebrow>Resultado da operação</Eyebrow>
        <span className="rounded-full bg-folha/20 px-2.5 py-0.5 font-mono text-[11px] text-folha">
          {snap.tipo === 'troca'
            ? `troca: ${snap.saborAnterior} → ${snap.sabor}`
            : snap.sabor}
        </span>
      </div>

      {/* Strategy de preço */}
      <div>
        <p className="mb-1 text-xs text-cream/60">
          Estratégia de preço aplicada (Strategy):
        </p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
          <span
            className={`rounded-lg border px-2.5 py-1 ${
              !snap.promocional
                ? 'border-crust bg-crust/15 text-crust'
                : 'border-white/10 text-cream/40 line-through'
            }`}
          >
            padrão {brl(snap.precoBase)}
          </span>
          <span
            className={`rounded-lg border px-2.5 py-1 ${
              snap.promocional
                ? 'border-folha bg-folha/15 text-folha'
                : 'border-white/10 text-cream/40'
            }`}
          >
            promocional {brl(Math.max(snap.precoBase - 2, 2))}
          </span>
          <span className="text-cream/50">→ cobrado</span>
          <span className="font-bold text-cream">{brl(snap.preco)}</span>
        </div>
      </div>

      {/* Cálculo do troco */}
      <div>
        <p className="mb-2 text-xs text-cream/60">Cálculo do troco:</p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-base">
          <span className="text-cream">{brl(snap.notaPaga)}</span>
          <span className="text-cream/50">−</span>
          <span className="text-cream">{brl(snap.preco)}</span>
          <span className="text-cream/50">=</span>
          <span className="font-bold text-crust">{brl(trocoEsperado)}</span>
        </div>
        <div className="mt-3 rounded-lg bg-black/30 p-3">
          <TrocoStack troco={snap.troco} />
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2 font-mono text-xs">
            <span className="text-cream/50">soma das cédulas =</span>
            <span className="font-bold text-cream">{brl(soma)}</span>
            {fecha ? (
              <span className="text-folha">✓ fecha</span>
            ) : (
              <span className="text-pimenta">✕ não fecha</span>
            )}
            {paridade && (
              <span className="ml-auto rounded-full bg-crust/20 px-2 py-0.5 text-[11px] text-crust">
                usou R$5 p/ paridade
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Movimento real: antes → depois */}
      <div>
        <p className="mb-1 text-xs text-cream/60">Movimentação real (antes → depois):</p>
        <Delta label="Saldo" antes={brl(snap.saldoAntes)} depois={brl(snap.saldoDepois)} />
        {slots.map((s) => {
          const diff = s.depois - s.antes
          return (
            <div key={s.denominacao} className="flex items-baseline justify-between gap-2 py-1">
              <span className="text-sm text-cream/60">Slot R$ {s.denominacao}</span>
              <span className="readout flex items-center gap-2 text-sm">
                <span className="text-cream/50">{s.antes}</span>
                <span className="text-crust">→</span>
                <span className="font-bold text-crust">{s.depois}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                    diff > 0 ? 'bg-folha/20 text-folha' : 'bg-pimenta/20 text-pimenta'
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
