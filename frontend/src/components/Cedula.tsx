import { notaColor } from '../lib/format'

interface CedulaProps {
  denominacao: number
  size?: 'sm' | 'md' | 'lg'
  /** mostra "×N" ao lado, para troco empilhado */
  quantidade?: number
}

const SIZES = {
  sm: 'h-7 w-12 text-[10px]',
  md: 'h-9 w-16 text-xs',
  lg: 'h-11 w-20 text-sm',
}

/** Uma cédula do Real renderizada na sua cor real, como objeto físico. */
export function Cedula({ denominacao, size = 'md', quantidade }: CedulaProps) {
  const color = notaColor(denominacao)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${SIZES[size]} relative inline-flex items-center justify-center rounded-none font-mono font-bold text-white/95 shadow-sm`}
        style={{
          background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 70%, black))`,
          border: '1px solid rgb(255 255 255 / 0.25)',
        }}
        title={`Cédula de R$ ${denominacao}`}
      >
        <span className="absolute left-1 top-0.5 text-[8px] opacity-70">R$</span>
        {denominacao}
      </span>
      {quantidade !== undefined && (
        <span className="font-mono text-sm text-cream/70">×{quantidade}</span>
      )}
    </span>
  )
}

/** Lista de troco renderizada como cédulas empilhadas. */
export function TrocoStack({
  troco,
  size = 'md',
}: {
  troco: { denominacao: number; quantidade: number }[]
  size?: 'sm' | 'md' | 'lg'
}) {
  if (troco.length === 0) {
    return <span className="font-mono text-sm text-cream/40">sem troco</span>
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {troco.map((t, i) => (
        <div key={t.denominacao} className="flex items-center gap-1.5">
          {i > 0 && <span className="font-mono text-cream/40">+</span>}
          <Cedula denominacao={t.denominacao} quantidade={t.quantidade} size={size} />
        </div>
      ))}
    </div>
  )
}
