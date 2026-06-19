import { useState } from 'react'
import type { Cliente } from '../types'
import { brl } from '../lib/format'
import { Button, Eyebrow, Panel, Spinner } from '../components/ui'

interface LoginProps {
  clientes: Cliente[]
  loadingClientes: boolean
  conexaoOk: boolean
  onLogin: (login: string) => Promise<void>
  onCadastro: (nome: string, login: string, saldoInicial: number) => Promise<void>
  onReload: () => void
}

export function Login({
  clientes,
  loadingClientes,
  conexaoOk,
  onLogin,
  onCadastro,
  onReload,
}: LoginProps) {
  const [loginField, setLoginField] = useState('')
  const [novo, setNovo] = useState({ nome: '', login: '', saldo: '0' })
  const [busy, setBusy] = useState<'login' | 'cadastro' | null>(null)

  async function submitLogin(login: string) {
    setBusy('login')
    try {
      await onLogin(login)
    } finally {
      setBusy(null)
    }
  }

  async function submitCadastro(e: React.FormEvent) {
    e.preventDefault()
    setBusy('cadastro')
    try {
      await onCadastro(novo.nome.trim(), novo.login.trim(), Number(novo.saldo) || 0)
      setNovo({ nome: '', login: '', saldo: '0' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto min-h-svh max-w-5xl px-5 py-10">
      <header className="mb-10 text-center">
        <p className="font-mono text-sm tracking-[0.3em] text-crust/80">🍗 CAIXA ELETRÔNICO</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold leading-none text-cream sm:text-6xl">
          Banca de Coxinha
        </h1>
        <p className="mx-auto mt-3 max-w-md text-cream/60">
          Insira cédulas, compre salgados e veja os <em>design patterns</em> trabalhando por baixo.
        </p>
      </header>

      {!conexaoOk && (
        <div className="mx-auto mb-6 max-w-2xl rounded-none border border-pimenta/50 bg-pimenta/15 px-4 py-3 text-sm">
          Back-end fora do ar. Verifique se a API está rodando em{' '}
          <code className="font-mono text-crust">localhost:5141</code>.{' '}
          <button onClick={onReload} className="underline">
            Tentar de novo
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Selecionar cliente existente */}
        <Panel>
          <Eyebrow>Entrar</Eyebrow>
          <h2 className="mb-4 mt-1 font-display text-2xl font-bold text-cream">
            Escolha um cliente
          </h2>

          {loadingClientes ? (
            <div className="flex items-center gap-2 text-cream/60">
              <Spinner /> carregando clientes…
            </div>
          ) : clientes.length === 0 ? (
            <p className="text-sm text-cream/50">Nenhum cliente. Cadastre um ao lado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {clientes.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => submitLogin(c.login)}
                    disabled={busy !== null}
                    className="flex w-full items-center justify-between rounded-none border border-white/10 bg-white/5 px-4 py-3 text-left transition-colors hover:border-crust/50 hover:bg-crust/10 disabled:opacity-50"
                  >
                    <span>
                      <span className="block font-medium text-cream">{c.nome}</span>
                      <span className="font-mono text-xs text-cream/50">@{c.login}</span>
                    </span>
                    <span className="readout font-bold text-crust">{brl(c.saldo)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (loginField.trim()) submitLogin(loginField.trim())
            }}
            className="mt-4 flex gap-2 border-t border-white/10 pt-4"
          >
            <input
              value={loginField}
              onChange={(e) => setLoginField(e.target.value)}
              placeholder="login (ex.: cliente)"
              className="flex-1 rounded-none border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm text-cream placeholder:text-cream/30 focus:border-crust focus:outline-none"
            />
            <Button type="submit" disabled={busy !== null || !loginField.trim()}>
              {busy === 'login' ? <Spinner /> : 'Entrar'}
            </Button>
          </form>
        </Panel>

        {/* Cadastrar novo cliente */}
        <Panel>
          <Eyebrow>Novo</Eyebrow>
          <h2 className="mb-4 mt-1 font-display text-2xl font-bold text-cream">
            Cadastrar cliente
          </h2>
          <form onSubmit={submitCadastro} className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-cream/60">Nome</span>
              <input
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                required
                className="w-full rounded-none border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-cream focus:border-crust focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-cream/60">Login</span>
              <input
                value={novo.login}
                onChange={(e) => setNovo({ ...novo, login: e.target.value })}
                required
                className="w-full rounded-none border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm text-cream focus:border-crust focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-cream/60">Saldo inicial (R$)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={novo.saldo}
                onChange={(e) => setNovo({ ...novo, saldo: e.target.value })}
                className="w-full rounded-none border border-white/10 bg-black/30 px-3 py-2.5 readout text-sm text-cream focus:border-crust focus:outline-none"
              />
            </label>
            <Button type="submit" disabled={busy !== null} className="mt-1">
              {busy === 'cadastro' ? <Spinner /> : 'Cadastrar e entrar'}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
