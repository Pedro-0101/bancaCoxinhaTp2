import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="label-eyebrow">{children}</p>
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`panel p-5 ${className}`}>{children}</section>
}

type Variant = 'primary' | 'ghost' | 'danger'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-crust text-black hover:bg-crust-soft disabled:bg-crust/30 disabled:text-black/50',
  ghost:
    'bg-white/5 text-cream hover:bg-white/10 border border-white/10 disabled:opacity-40',
  danger: 'bg-pimenta/90 text-white hover:bg-pimenta disabled:opacity-40',
}

export function Button({ variant = 'primary', className = '', ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-none px-4 py-2.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crust disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  )
}

/** Mostra um valor "antes → depois" para evidenciar movimentação real. */
export function Delta({
  label,
  antes,
  depois,
}: {
  label: string
  antes: string
  depois: string
}) {
  const mudou = antes !== depois
  return (
    <div className="flex items-baseline justify-between gap-2 py-1">
      <span className="text-sm text-cream/60">{label}</span>
      <span className="readout flex items-center gap-2 text-sm">
        <span className="text-cream/50">{antes}</span>
        <span className="text-crust">→</span>
        <span className={mudou ? 'font-bold text-crust' : 'text-cream/70'}>{depois}</span>
      </span>
    </div>
  )
}
