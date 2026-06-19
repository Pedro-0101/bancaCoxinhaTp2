import { useCallback, useState } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

let nextId = 1

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId++
      setToasts((t) => [...t, { id, kind, message }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}

const STYLES: Record<ToastKind, string> = {
  success: 'border-folha/50 bg-folha/15 text-cream',
  error: 'border-pimenta/60 bg-pimenta/20 text-cream',
  info: 'border-crust/50 bg-crust/15 text-cream',
}

const ICONS: Record<ToastKind, string> = {
  success: '✓',
  error: '!',
  info: 'i',
}

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(90vw,380px)] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`animate-drop pointer-events-auto flex items-start gap-3 rounded-none border px-4 py-3 text-left text-sm shadow-lg backdrop-blur ${STYLES[t.kind]}`}
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 font-mono text-xs font-bold">
            {ICONS[t.kind]}
          </span>
          <span className="leading-snug">{t.message}</span>
        </button>
      ))}
    </div>
  )
}
