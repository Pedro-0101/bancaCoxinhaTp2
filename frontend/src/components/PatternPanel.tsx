import { PIPELINES, type AcaoTipo } from '../lib/patterns'
import { Eyebrow } from './ui'

export interface PatternEvent {
  id: number
  acao: AcaoTipo
  hora: string
  detalhe?: string
  ok: boolean
}

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

/** Painel didático — a cada ação mostra o pipeline de Design Patterns acionado. */
export function PatternPanel({ events }: { events: PatternEvent[] }) {
  const latest = events[0]
  const pipeline = latest ? PIPELINES[latest.acao] : null

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <Eyebrow>Design Patterns · ao vivo</Eyebrow>
        <h2 className="font-display text-xl font-bold text-cream">
          O que rodou por baixo
        </h2>
      </div>

      {!pipeline ? (
        <p className="text-sm text-cream/50">
          Dispare uma ação no caixa para ver o pipeline de padrões acionado.
        </p>
      ) : (
        <div
          key={latest.id}
          className={`animate-drop rounded-none border p-3 ${
            latest.ok ? 'border-crust/30 bg-black/20' : 'border-pimenta/40 bg-pimenta/10'
          }`}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-display font-bold text-crust">{pipeline.titulo}</span>
            <span className="font-mono text-[10px] text-cream/40">{latest.hora}</span>
          </div>
          <p className="mb-3 text-xs text-cream/60">{pipeline.resumo}</p>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {pipeline.passos.map((p, i) => (
              <div key={p.nome} className="flex items-center gap-1.5">
                {i > 0 && <span className="font-mono text-crust/60">→</span>}
                <Chip nome={p.nome} papel={p.papel} />
              </div>
            ))}
          </div>
          {latest.detalhe && (
            <p className="mt-3 border-t border-white/10 pt-2 font-mono text-xs text-cream/70">
              {latest.detalhe}
            </p>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1">
        <Eyebrow>Histórico de ações</Eyebrow>
        <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto pr-1">
          {events.slice(1).map((e) => {
            const p = PIPELINES[e.acao]
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-none border border-white/5 bg-black/15 px-2.5 py-1.5"
              >
                <span className="flex items-center gap-2 text-xs">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      e.ok ? 'bg-folha' : 'bg-pimenta'
                    }`}
                  />
                  <span className="text-cream/80">{p.titulo}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] text-cream/40">{e.hora}</span>
              </li>
            )
          })}
          {events.length <= 1 && (
            <li className="px-1 py-2 text-xs text-cream/40">Sem ações anteriores.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
