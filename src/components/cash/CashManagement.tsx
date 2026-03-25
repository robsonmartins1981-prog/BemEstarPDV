
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { CashSession, CashOperation, PaymentMethod, Terminal } from '../../types';
import { safeFormat } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatUtils';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  DollarSign,
  User,
  Monitor
} from 'lucide-react';
import Button from '../shared/Button';
import { clsx } from 'clsx';

/**
 * Componente de Gestão de Controle de Caixa (CRUD)
 * Permite visualizar, editar e excluir sessões e operações de caixa.
 */
const CashManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'terminals'>('sessions');
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [operations, setOperations] = useState<CashOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  
  const [editingSession, setEditingSession] = useState<CashSession | null>(null);
  const [editingOperation, setEditingOperation] = useState<CashOperation | null>(null);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    type: 'session' | 'operation' | 'terminal';
    id: string;
    message: string;
  }>({ isOpen: false, type: 'session', id: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSessions, allOperations, allTerminals] = await Promise.all([
        db.getAll('cashSessions'),
        db.getAll('cashOperations'),
        db.getAll('terminals')
      ]);
      
      // Ordenar sessões pela data de abertura (mais recente primeiro)
      setSessions(allSessions.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()));
      setOperations(allOperations);
      setTerminals(allTerminals);
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    setConfirmDelete({
      isOpen: true,
      type: 'operation',
      id: operationId,
      message: 'Tem certeza que deseja excluir esta operação? Isso afetará o saldo do caixa e não poderá ser desfeito.'
    });
  };

  const executeDeleteOperation = async (operationId: string) => {
    try {
      await db.delete('cashOperations', operationId);
      await loadData();
      setConfirmDelete({ ...confirmDelete, isOpen: false });
    } catch (error) {
      alert('Erro ao excluir operação.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setConfirmDelete({
      isOpen: true,
      type: 'session',
      id: sessionId,
      message: 'Tem certeza que deseja excluir esta sessão de caixa e TODAS as suas operações e vendas vinculadas? Esta ação é irreversível.'
    });
  };

  const executeDeleteSession = async (sessionId: string) => {
    try {
      // Excluir operações vinculadas
      const sessionOps = operations.filter(op => op.sessionId === sessionId);
      for (const op of sessionOps) {
        await db.delete('cashOperations', op.id);
      }
      
      // Excluir a sessão
      await db.delete('cashSessions', sessionId);
      
      // Excluir vendas vinculadas (opcional, mas recomendado para limpeza)
      const allSales = await db.getAll('sales');
      const sessionSales = allSales.filter(s => s.sessionId === sessionId);
      for (const sale of sessionSales) {
        await db.delete('sales', sale.id);
      }

      await loadData();
      setConfirmDelete({ ...confirmDelete, isOpen: false });
    } catch (error) {
      alert('Erro ao excluir sessão.');
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    try {
      await db.put('cashSessions', editingSession);
      setEditingSession(null);
      await loadData();
    } catch (error) {
      alert('Erro ao atualizar sessão.');
    }
  };

  const handleUpdateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOperation) return;
    try {
      await db.put('cashOperations', editingOperation);
      setEditingOperation(null);
      await loadData();
    } catch (error) {
      alert('Erro ao atualizar operação.');
    }
  };

  const handleDeleteTerminal = async (terminalId: string) => {
    setConfirmDelete({
      isOpen: true,
      type: 'terminal',
      id: terminalId,
      message: 'Tem certeza que deseja excluir este terminal? Isso não afetará as sessões passadas, mas o terminal não poderá mais ser usado.'
    });
  };

  const executeDeleteTerminal = async (terminalId: string) => {
    try {
      await db.delete('terminals', terminalId);
      await loadData();
      setConfirmDelete({ ...confirmDelete, isOpen: false });
    } catch (error) {
      alert('Erro ao excluir terminal.');
    }
  };

  const handleUpdateTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerminal) return;
    try {
      await db.put('terminals', editingTerminal);
      setEditingTerminal(null);
      await loadData();
    } catch (error) {
      alert('Erro ao atualizar terminal.');
    }
  };

  const handleCreateTerminal = async () => {
    const name = prompt('Nome do Terminal:');
    if (!name) return;
    try {
      await db.add('terminals', {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        active: true
      });
      await loadData();
    } catch (error) {
      alert('Erro ao criar terminal.');
    }
  };

  const calculateBalance = (session: CashSession) => {
    if (session.finalAmount !== undefined && session.status === 'CLOSED') return session.finalAmount;
    
    const sessionOps = (operations || []).filter(op => op.sessionId === session.id);
    const opsTotal = sessionOps.reduce((acc, op) => {
      if (op.type === 'SUPRIMENTO' || op.type === 'REFORCO' || op.type === 'VENDA') return acc + (op.amount || 0);
      if (op.type === 'SANGRIA') return acc - (op.amount || 0);
      return acc;
    }, 0);
    
    const salesTotal = (session.sales || []).reduce((acc, sale) => {
      // Apenas vendas em dinheiro afetam o saldo físico do caixa
      const cashPayments = (sale.payments || []).filter(p => p.method === PaymentMethod.DINHEIRO);
      const cashTotal = cashPayments.reduce((sum, p) => sum + p.amount, 0);
      return acc + cashTotal;
    }, 0);

    return (session.initialAmount || 0) + opsTotal + salesTotal;
  };

  const getSessionTotals = (session: CashSession) => {
    const totals = {
      [PaymentMethod.DINHEIRO]: 0,
      [PaymentMethod.PIX]: 0,
      [PaymentMethod.CREDITO]: 0,
      [PaymentMethod.DEBITO]: 0,
      [PaymentMethod.NOTINHA]: 0,
      revenue: 0,
      sales: 0
    };

    // Vendas registradas no PDV
    (session.sales || []).forEach(sale => {
      totals.sales += sale.totalAmount;
      (sale.payments || []).forEach(p => {
        if (totals[p.method] !== undefined) {
          totals[p.method] += p.amount;
        }
        // Notinha não entra no faturamento (revenue) até ser paga
        if (p.method !== PaymentMethod.NOTINHA) {
          totals.revenue += p.amount;
        }
      });
    });

    // Operações manuais do tipo VENDA (ex: recebimento de notinhas)
    const sessionOps = (operations || []).filter(op => op.sessionId === session.id);
    sessionOps.forEach(op => {
      if (op.type === 'VENDA') {
        const method = op.paymentMethod || PaymentMethod.DINHEIRO;
        if (totals[method] !== undefined) {
          totals[method] += op.amount;
        }
        totals.revenue += op.amount;
        // Não somamos em 'sales' porque 'sales' representa o faturamento bruto de produtos vendidos no momento
        // Mas o recebimento de dívida é faturamento líquido (revenue)
      }
    });

    return totals;
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = (session.openedBy?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (session.terminalId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'open' && !session.closedAt) || 
                         (filterStatus === 'closed' && session.closedAt);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs de Navegação */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('sessions')}
          className={clsx(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'sessions' ? "bg-white dark:bg-gray-800 text-theme-primary shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Sessões de Caixa
        </button>
        <button
          onClick={() => setActiveTab('terminals')}
          className={clsx(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'terminals' ? "bg-white dark:bg-gray-800 text-theme-primary shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Terminais (Caixas)
        </button>
      </div>

      {activeTab === 'sessions' ? (
        <>
          {/* Cabeçalho e Filtros */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por operador ou terminal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-theme-primary/20"
                />
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="text-gray-400 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm py-2 px-4 focus:ring-2 focus:ring-theme-primary/20"
                >
                  <option value="all">Todos os Status</option>
                  <option value="open">Abertos</option>
                  <option value="closed">Fechados</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Sessões */}
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma sessão de caixa encontrada.</p>
              </div>
            ) : (
              filteredSessions.map(session => (
                <div 
                  key={session.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Cabeçalho da Sessão */}
                  <div 
                    className={clsx(
                      "p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
                      expandedSession === session.id && "border-b border-gray-100 dark:border-gray-700"
                    )}
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        session.closedAt ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-600 animate-pulse"
                      )}>
                        <Monitor size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          Terminal: {session.terminalId}
                          <span className={clsx(
                            "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black",
                            session.closedAt ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-600"
                          )}>
                            {session.closedAt ? 'Fechado' : 'Aberto'}
                          </span>
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><User size={12} /> {session.openedBy}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {safeFormat(session.openedAt, "dd MMM yyyy HH:mm")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Saldo Atual/Final</p>
                        <p className="text-lg font-black text-theme-primary">
                          { formatCurrency(calculateBalance(session)) }
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingSession(session); }}
                          className="p-2 text-gray-400 hover:text-theme-primary transition-colors"
                          title="Editar Sessão"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Excluir Sessão"
                        >
                          <Trash2 size={18} />
                        </button>
                        {expandedSession === session.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Detalhes e Operações da Sessão */}
                  {expandedSession === session.id && (
                    <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Fundo Inicial</p>
                          <p className="font-bold text-gray-700 dark:text-gray-200">{formatCurrency(session.initialAmount)}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Faturamento (Líquido)</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(getSessionTotals(session).revenue)}
                          </p>
                          <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">Exclui Notinhas</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Total em Vendas</p>
                          <p className="font-bold text-theme-primary">
                            {formatCurrency(getSessionTotals(session).sales)}
                          </p>
                          <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">Inclui Notinhas</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        {Object.entries(getSessionTotals(session)).filter(([key]) => Object.values(PaymentMethod).includes(key as any)).map(([method, amount]) => (
                          <div key={method} className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-[8px] text-gray-400 uppercase font-black tracking-widest mb-1">{method}</p>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{formatCurrency(amount as number)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Histórico de Movimentações</h4>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <th className="pb-2 font-black uppercase text-[10px] tracking-widest">Data/Hora</th>
                                <th className="pb-2 font-black uppercase text-[10px] tracking-widest">Tipo</th>
                                <th className="pb-2 font-black uppercase text-[10px] tracking-widest">Descrição</th>
                                <th className="pb-2 font-black uppercase text-[10px] tracking-widest text-right">Valor</th>
                                <th className="pb-2 font-black uppercase text-[10px] tracking-widest text-right">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {operations.filter(op => op.sessionId === session.id).length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-4 text-center text-gray-400 italic">Nenhuma movimentação registrada.</td>
                                </tr>
                              ) : (
                                operations
                                  .filter(op => op.sessionId === session.id)
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .map(op => (
                                    <tr key={op.id} className="group">
                                      <td className="py-3 text-gray-600 dark:text-gray-400">
                                        {safeFormat(op.date, "HH:mm:ss")}
                                      </td>
                                      <td className="py-3">
                                        <span className={clsx(
                                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                          (op.type === 'SUPRIMENTO' || op.type === 'REFORCO' || op.type === 'VENDA') ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                        )}>
                                          {(op.type === 'SUPRIMENTO' || op.type === 'REFORCO' || op.type === 'VENDA') ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                                          {op.type === 'SUPRIMENTO' ? 'Suprimento' : op.type === 'SANGRIA' ? 'Sangria' : op.type === 'REFORCO' ? 'Reforço' : 'Venda'}
                                        </span>
                                      </td>
                                      <td className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                                        {op.description}
                                      </td>
                                      <td className={clsx(
                                        "py-3 text-right font-bold",
                                        (op.type === 'SUPRIMENTO' || op.type === 'REFORCO' || op.type === 'VENDA') ? "text-green-600" : "text-red-600"
                                      )}>
                                        {formatCurrency(op.amount)}
                                      </td>
                                      <td className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={() => setEditingOperation(op)}
                                            className="p-1.5 text-gray-400 hover:text-theme-primary transition-colors"
                                          >
                                            <Edit2 size={14} />
                                          </button>
                                          <button 
                                            onClick={() => handleDeleteOperation(op.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Gerenciar Terminais</h3>
            <Button onClick={handleCreateTerminal}>
              <Plus size={18} className="mr-2" /> Novo Terminal
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {terminals.map(terminal => (
              <div key={terminal.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-theme-primary/10 rounded-2xl flex items-center justify-center text-theme-primary">
                    <Monitor size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">{terminal.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {terminal.id}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Status:</span>
                    <span className={clsx("font-bold", terminal.active ? "text-emerald-500" : "text-red-500")}>
                      {terminal.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {terminal.lastOpenedAt && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Última Abertura:</span>
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {safeFormat(terminal.lastOpenedAt, "dd/MM HH:mm")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 py-2" onClick={() => setEditingTerminal(terminal)}>
                    <Edit2 size={14} className="mr-1" /> Editar
                  </Button>
                  <Button variant="secondary" className="flex-1 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteTerminal(terminal.id)}>
                    <Trash2 size={14} className="mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Editar Sessão */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-6">Editar Sessão de Caixa</h3>
            <form onSubmit={handleUpdateSession} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Terminal / Turno</label>
                <input 
                  type="text" 
                  value={editingSession.terminalId}
                  onChange={e => setEditingSession({...editingSession, terminalId: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-theme-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fundo Inicial (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editingSession.initialAmount}
                  onChange={e => setEditingSession({...editingSession, initialAmount: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-theme-primary/20"
                  required
                />
              </div>
              {editingSession.status === 'CLOSED' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor Final (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingSession.finalAmount || 0}
                    onChange={e => setEditingSession({...editingSession, finalAmount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-theme-primary/20"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditingSession(null)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1">Salvar Alterações</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Operação */}
      {editingOperation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-6">Editar Operação de Caixa</h3>
            <form onSubmit={handleUpdateOperation} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Descrição</label>
                <input 
                  type="text" 
                  value={editingOperation.description}
                  onChange={e => setEditingOperation({...editingOperation, description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-theme-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editingOperation.amount}
                  onChange={e => setEditingOperation({...editingOperation, amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-theme-primary/20"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditingOperation(null)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1">Salvar Alterações</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Terminal */}
      {editingTerminal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-6">Editar Terminal</h3>
            <form onSubmit={handleUpdateTerminal} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nome do Terminal</label>
                <input 
                  type="text" 
                  value={editingTerminal.name}
                  onChange={e => setEditingTerminal({...editingTerminal, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-theme-primary/20"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="terminal-active"
                  checked={editingTerminal.active}
                  onChange={e => setEditingTerminal({...editingTerminal, active: e.target.checked})}
                  className="w-4 h-4 text-theme-primary rounded focus:ring-theme-primary/20"
                />
                <label htmlFor="terminal-active" className="text-sm font-bold text-gray-600 dark:text-gray-300">Terminal Ativo</label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setEditingTerminal(null)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1">Salvar Alterações</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {confirmDelete.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              {confirmDelete.message}
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                variant="primary" 
                className="w-full bg-red-500 hover:bg-red-600 border-none shadow-lg shadow-red-500/30"
                onClick={() => {
                  if (confirmDelete.type === 'session') executeDeleteSession(confirmDelete.id);
                  else if (confirmDelete.type === 'operation') executeDeleteOperation(confirmDelete.id);
                  else if (confirmDelete.type === 'terminal') executeDeleteTerminal(confirmDelete.id);
                }}
              >
                Sim, Excluir Agora
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
              >
                Não, Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashManagement;
