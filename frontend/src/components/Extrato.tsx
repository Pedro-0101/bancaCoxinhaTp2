import { useMemo, useState } from 'react'
import type { Movimentacao, Sabor, TipoMovimentacao } from '../types'
import { brl, horaMin } from '../lib/format'
import { TrocoStack } from './Cedula'
import { Button, Eyebrow, Spinner } from './ui'

interface ExtratoProps {
  extrato: Movimentacao[]
  sabores: Sabor[]
  clienteId: number
  busy: string | null
  onTroca: (movimentacaoId: number, novoSabor: string, promocional: boolean) => void
  onDesfazer: (clienteIds: number[]) => void
}

const TIPO_STYLE: Record<TipoMovimentacao, string> = {
  ENTRADA: 'bg-folha/20 text-folha',
  SAIDA: 'bg-crust/20 text-crust',
  ESTORNO: 'bg-pimenta/20 text-pimenta',
}

export function Extrato({
  extrato,
  sabores,
  clienteId,
  busy,
  onTroca,
  onDesfazer,
}: ExtratoProps) {
  const [trocaAberta, setTrocaAberta] = useState<number | null>(null)
  const [novoSabor, setNovoSabor] = useState('')
  const [promo, setPromo] = useState(false)
  const [idsField, setIdsField] = useState(String(clienteId))

  // ids de movimentações que já foram estornadas (origem de algum ESTORNO)
  const estornadas = useMemo(
    () =>
      new Set(
        extrato
          .filter((m) => m.movimentacaoOrigemId != null)
          .map((m) => m.movimentacaoOrigemId as number),
      ),
    [extrato],
  )

  function confirmarTroca(movId: number) {
    if (novoSabor) {
      onTroca(movId, novoSabor, promo)
      setTrocaAberta(null)
      setNovoSabor('')
      setPromo(false)
    }
  }

  const idsParse = idsField
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Extrato · Movimentações</Eyebrow>
          <h2 className="mt-1 font-display text-xl font-bold text-cream">Histórico</h2>
        </div>

        {/* Command: desfazer */}
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <span className="w-full text-[11px] text-cream/50">
            Command · desfazer última transação
          </span>
          <Button
            variant="ghost"
            onClick={() => onDesfazer([clienteId])}
            disabled={busy !== null}
            className="px-3 py-1.5 text-sm"
          >
            {busy === 'desfazer' ? <Spinner /> : 'Deste cliente'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDesfazer([])}
            disabled={busy !== null}
            className="px-3 py-1.5 text-sm"
          >
            Global
          </Button>
          <label className="flex items-center gap-1">
            <input
              value={idsField}
              onChange={(e) => setIdsField(e.target.value)}
              placeholder="clienteIds"
              className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-cream focus:border-crust focus:outline-none"
            />
            <Button
              variant="ghost"
              onClick={() => onDesfazer(idsParse)}
              disabled={busy !== null || idsParse.length === 0}
              className="px-3 py-1.5 text-sm"
            >
              Filtrar
            </Button>
          </label>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {extrato.length === 0 && (
          <li className="rounded-xl border border-white/5 bg-black/15 px-4 py-6 text-center text-sm text-cream/40">
            Nenhuma movimentação ainda.
          </li>
        )}
        {extrato.map((m, idx) => {
          const podeTrocar = m.tipoMovimentacao === 'SAIDA' && !estornadas.has(m.id)
          return (
            <li
              key={m.id}
              className={`rounded-xl border border-white/10 bg-black/20 px-4 py-3 ${
                idx === 0 ? 'animate-flash' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${TIPO_STYLE[m.tipoMovimentacao]}`}
                >
                  {m.tipoMovimentacao}
                </span>
                <span className="font-mono text-xs text-cream/40">{horaMin(m.dataHora)}</span>
                {m.sabor && <span className="font-display font-bold text-cream">{m.sabor}</span>}
                <span className="ml-auto font-mono text-sm text-cream/60">
                  nota {brl(m.valorNota)} · valor{' '}
                  <span className="text-cream">{brl(m.valor)}</span>
                </span>
              </div>

              {m.troco.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-cream/40">troco:</span>
                  <TrocoStack troco={m.troco} size="sm" />
                </div>
              )}

              {estornadas.has(m.id) && (
                <p className="mt-1 font-mono text-[11px] text-pimenta/80">↩ estornada</p>
              )}

              {podeTrocar && (
                <div className="mt-2 border-t border-white/10 pt-2">
                  {trocaAberta === m.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={novoSabor}
                        onChange={(e) => setNovoSabor(e.target.value)}
                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-cream focus:border-crust focus:outline-none"
                      >
                        <option value="">novo sabor…</option>
                        {sabores
                          .filter((s) => s.sabor !== m.sabor)
                          .map((s) => (
                            <option key={s.sabor} value={s.sabor}>
                              {s.sabor} · {brl(s.precoBase)}
                            </option>
                          ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-cream/70">
                        <input
                          type="checkbox"
                          checked={promo}
                          onChange={(e) => setPromo(e.target.checked)}
                        />
                        promo
                      </label>
                      <Button
                        onClick={() => confirmarTroca(m.id)}
                        disabled={busy !== null || !novoSabor}
                        className="px-3 py-1.5 text-sm"
                      >
                        {busy === 'troca' ? <Spinner /> : 'Confirmar'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setTrocaAberta(null)}
                        className="px-3 py-1.5 text-sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setTrocaAberta(m.id)
                        setNovoSabor('')
                        setPromo(false)
                      }}
                      disabled={busy !== null}
                      className="px-3 py-1.5 text-sm"
                    >
                      Trocar sabor
                    </Button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
