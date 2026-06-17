import type { TrocoItem } from '../types'

export function brl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function horaMin(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Cor real da cédula do Real por denominação → token CSS definido em index.css
export function notaColor(denominacao: number): string {
  const map: Record<number, string> = {
    2: 'var(--color-nota-2)',
    5: 'var(--color-nota-5)',
    10: 'var(--color-nota-10)',
    20: 'var(--color-nota-20)',
    50: 'var(--color-nota-50)',
    100: 'var(--color-nota-100)',
    200: 'var(--color-nota-200)',
  }
  return map[denominacao] ?? '#888'
}

// Soma total de uma lista de troco (para conferência visual)
export function somaTroco(troco: TrocoItem[]): number {
  return troco.reduce((acc, t) => acc + t.denominacao * t.quantidade, 0)
}

// Troco ímpar exige uma cédula de R$5 (paridade), pois a menor cédula é R$2
export function usouParidade(troco: TrocoItem[]): boolean {
  return troco.some((t) => t.denominacao === 5 && t.quantidade % 2 === 1)
}
