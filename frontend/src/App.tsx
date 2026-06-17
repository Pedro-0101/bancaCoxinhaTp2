import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import { ApiError, MSG_TROCO_IMPOSSIVEL } from './types'
import type { Cliente, Movimentacao, Sabor, Slot } from './types'
import type { AcaoTipo } from './lib/patterns'
import { brl } from './lib/format'
import { useToasts, Toaster } from './components/Toast'
import { Login } from './screens/Login'
import { Caixa } from './components/Caixa'
import { SlotsPanel } from './components/SlotsPanel'
import { Extrato } from './components/Extrato'
import { PatternPanel, type PatternEvent } from './components/PatternPanel'
import { OperationResult, type OperationSnapshot } from './components/OperationResult'
import { Button, Panel } from './components/ui'

function agora(): string {
  return new Date().toLocaleTimeString('pt-BR')
}

export default function App() {
  const { toasts, push, dismiss } = useToasts()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [sabores, setSabores] = useState<Sabor[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [extrato, setExtrato] = useState<Movimentacao[]>([])

  const [loadingClientes, setLoadingClientes] = useState(true)
  const [conexaoOk, setConexaoOk] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const [events, setEvents] = useState<PatternEvent[]>([])
  const [ultima, setUltima] = useState<OperationSnapshot | null>(null)
  const [saldoTick, setSaldoTick] = useState(0)

  const eventId = useRef(1)

  const logPattern = useCallback((acao: AcaoTipo, ok: boolean, detalhe?: string) => {
    setEvents((prev) => [{ id: eventId.current++, acao, hora: agora(), ok, detalhe }, ...prev])
  }, [])

  // --- loaders que atualizam estado e retornam o dado fresco ---
  const reloadSlots = useCallback(async () => {
    const s = await api.listarSlots()
    setSlots(s)
    return s
  }, [])

  const reloadCliente = useCallback(async (id: number) => {
    const c = await api.buscarCliente(id)
    setCliente(c)
    setSaldoTick((t) => t + 1)
    return c
  }, [])

  const reloadExtrato = useCallback(async (id: number) => {
    const e = await api.extrato(id)
    setExtrato(e)
    return e
  }, [])

  const carregarBase = useCallback(async () => {
    setLoadingClientes(true)
    try {
      const [cs, sb, sl] = await Promise.all([
        api.listarClientes(),
        api.listarSabores(),
        api.listarSlots(),
      ])
      setClientes(cs)
      setSabores(sb)
      setSlots(sl)
      setConexaoOk(true)
    } catch (e) {
      setConexaoOk(false)
      if (e instanceof ApiError) push('error', e.message)
    } finally {
      setLoadingClientes(false)
    }
  }, [push])

  useEffect(() => {
    carregarBase()
  }, [carregarBase])

  const handleError = useCallback(
    (e: unknown, acao: AcaoTipo) => {
      if (e instanceof ApiError) {
        const impossivel = e.message === MSG_TROCO_IMPOSSIVEL
        push('error', impossivel ? `⛔ ${e.message}` : e.message)
        logPattern(acao, false, `Erro ${e.status}: ${e.message}`)
      } else {
        push('error', 'Erro inesperado.')
        logPattern(acao, false, 'Erro inesperado.')
      }
    },
    [push, logPattern],
  )

  // --- handlers de operação ---
  async function doLogin(login: string) {
    try {
      const c = await api.login(login)
      setCliente(c)
      setSaldoTick((t) => t + 1)
      await Promise.all([reloadExtrato(c.id), reloadSlots()])
      logPattern('login', true, `${c.nome} · saldo ${brl(c.saldo)}`)
      push('success', `Bem-vindo, ${c.nome}.`)
    } catch (e) {
      handleError(e, 'login')
    }
  }

  async function doCadastro(nome: string, login: string, saldoInicial: number) {
    try {
      const c = await api.cadastrarCliente(nome, login, saldoInicial)
      setClientes((prev) => [...prev, c])
      setCliente(c)
      setSaldoTick((t) => t + 1)
      await Promise.all([reloadExtrato(c.id), reloadSlots()])
      logPattern('cadastro', true, `${c.nome} criado · saldo ${brl(c.saldo)}`)
      push('success', `Cliente ${c.nome} cadastrado.`)
    } catch (e) {
      handleError(e, 'cadastro')
    }
  }

  async function doCredito(denominacao: number) {
    if (!cliente) return
    const saldoAntes = cliente.saldo
    setBusy(`credito:${denominacao}`)
    try {
      const r = await api.inserirCredito(cliente.id, denominacao)
      await Promise.all([reloadCliente(cliente.id), reloadSlots(), reloadExtrato(cliente.id)])
      logPattern(
        'credito',
        true,
        `R$ ${denominacao} inserida · saldo ${brl(saldoAntes)} → ${brl(r.saldo)} · slot R$${denominacao} = ${r.quantidadeSlot}`,
      )
      push('success', `R$ ${denominacao} inseridos.`)
    } catch (e) {
      handleError(e, 'credito')
    } finally {
      setBusy(null)
    }
  }

  async function doCompra(sabor: string, notaPaga: number, promocional: boolean) {
    if (!cliente) return
    const saldoAntes = cliente.saldo
    const slotsAntes = slots
    const precoBase = sabores.find((s) => s.sabor === sabor)?.precoBase ?? 0
    setBusy('compra')
    try {
      const r = await api.comprar(cliente.id, sabor, notaPaga, promocional)
      await reloadCliente(cliente.id)
      const slotsDepois = await reloadSlots()
      await reloadExtrato(cliente.id)
      setUltima({
        tipo: 'compra',
        sabor,
        notaPaga,
        precoBase,
        preco: r.preco,
        promocional,
        troco: r.troco,
        saldoAntes,
        saldoDepois: r.saldo,
        slotsAntes,
        slotsDepois,
      })
      logPattern(
        'compra',
        true,
        `${brl(notaPaga)} − ${brl(r.preco)} = ${brl(notaPaga - r.preco)} de troco`,
      )
      push('success', `${sabor} comprada — troco ${brl(notaPaga - r.preco)}.`)
    } catch (e) {
      handleError(e, 'compra')
    } finally {
      setBusy(null)
    }
  }

  async function doTroca(movimentacaoId: number, novoSabor: string, promocional: boolean) {
    if (!cliente) return
    const mov = extrato.find((m) => m.id === movimentacaoId)
    const saldoAntes = cliente.saldo
    const slotsAntes = slots
    const precoBase = sabores.find((s) => s.sabor === novoSabor)?.precoBase ?? 0
    setBusy('troca')
    try {
      const r = await api.trocarSabor(cliente.id, movimentacaoId, novoSabor, promocional)
      await reloadCliente(cliente.id)
      const slotsDepois = await reloadSlots()
      await reloadExtrato(cliente.id)
      setUltima({
        tipo: 'troca',
        sabor: r.novoSabor,
        saborAnterior: r.saborAnterior,
        notaPaga: mov?.valorNota ?? 0,
        precoBase,
        preco: r.preco,
        promocional,
        troco: r.troco,
        saldoAntes,
        saldoDepois: r.saldo,
        slotsAntes,
        slotsDepois,
      })
      logPattern('troca', true, `Estorno #${r.estornoId} + nova SAIDA #${r.novaMovimentacaoId}`)
      push('success', `Trocado: ${r.saborAnterior} → ${r.novoSabor}.`)
    } catch (e) {
      handleError(e, 'troca')
    } finally {
      setBusy(null)
    }
  }

  async function doDesfazer(clienteIds: number[]) {
    if (!cliente) return
    setBusy('desfazer')
    try {
      const r = await api.desfazer(clienteIds)
      await Promise.all([reloadCliente(cliente.id), reloadSlots(), reloadExtrato(cliente.id)])
      setUltima(null)
      logPattern(
        'desfazer',
        true,
        `ESTORNO #${r.id} da movimentação #${r.movimentacaoOrigemId}${clienteIds.length ? ` · filtro [${clienteIds.join(', ')}]` : ' · global'}`,
      )
      push('success', `Desfeito — estorno #${r.id} gerado.`)
    } catch (e) {
      handleError(e, 'desfazer')
    } finally {
      setBusy(null)
    }
  }

  async function doAbastecer(denominacao: number, quantidade: number) {
    setBusy('abastecer')
    try {
      const r = await api.abastecer(denominacao, quantidade)
      await reloadSlots()
      logPattern('abastecer', true, `Slot R$${denominacao} reabastecido · total = ${r.quantidade}`)
      push('success', `Slot R$${denominacao} reabastecido (+${quantidade}).`)
    } catch (e) {
      handleError(e, 'abastecer')
    } finally {
      setBusy(null)
    }
  }

  function trocarUsuario() {
    setCliente(null)
    setExtrato([])
    setUltima(null)
    carregarBase()
  }

  // --- render ---
  if (!cliente) {
    return (
      <>
        <Login
          clientes={clientes}
          loadingClientes={loadingClientes}
          conexaoOk={conexaoOk}
          onLogin={doLogin}
          onCadastro={doCadastro}
          onReload={carregarBase}
        />
        <Toaster toasts={toasts} onDismiss={dismiss} />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      {/* Cabeçalho com saldo em destaque */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-chassis-3 to-chassis-2 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🍗</span>
          <div>
            <p className="font-mono text-[11px] tracking-[0.25em] text-crust/80">
              BANCA DE COXINHA
            </p>
            <p className="font-display text-lg font-bold leading-tight text-cream">
              {cliente.nome}{' '}
              <span className="font-mono text-sm font-normal text-cream/40">
                @{cliente.login}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-widest text-cream/50">Saldo</p>
            <p key={saldoTick} className="readout animate-pop text-3xl font-bold text-crust">
              {brl(cliente.saldo)}
            </p>
          </div>
          <Button variant="ghost" onClick={trocarUsuario}>
            Trocar usuário
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Operações */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Caixa sabores={sabores} busy={busy} onCredito={doCredito} onCompra={doCompra} />
          <Panel>
            <SlotsPanel slots={slots} busy={busy} onAbastecer={doAbastecer} />
          </Panel>
          <Panel>
            <Extrato
              extrato={extrato}
              sabores={sabores}
              clienteId={cliente.id}
              busy={busy}
              onTroca={doTroca}
              onDesfazer={doDesfazer}
            />
          </Panel>
        </div>

        {/* Internals: padrões + cálculo */}
        <div className="lg:col-span-1">
          <div className="flex flex-col gap-6 lg:sticky lg:top-6">
            <Panel>
              <PatternPanel events={events} />
            </Panel>
            {ultima && (
              <Panel>
                <OperationResult snap={ultima} />
              </Panel>
            )}
          </div>
        </div>
      </div>

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
