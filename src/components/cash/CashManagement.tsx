
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import { CashSession, CashOperation } from '../../types';
import { safeFormat } from '../../utils/dateUtils';
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
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [operations, setOperations] = useState<CashOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSessions, allOperations] = await Promise.all([
        db.getAll('cashSessions'),
        db.getAll('cashOperations')
      ]);
      
      // Ordenar sessões pela data de abertura (mais recente primeiro)
      setSessions(allSessions.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()));
      setOperations(allOperations);
    } catch (error) {
      console.error('Erro ao carregar dados do caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta operação? Isso afetará o saldo do caixa.')) return;
    
    try {
      await db.delete('cashOperations', operationId);
      await loadData();
    } catch (error) {
      alert('Erro ao excluir operação.');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão de caixa e TODAS as suas operações?')) return;
    
    try {
      // Excluir operações vinculadas
      const sessionOps = operations.filter(op => op.sessionId === sessionId);
      for (const op of sessionOps) {
        await db.delete('cashOperations', op.id);
      }
      
      // Excluir a sessão
      await db.delete('cashSessions', sessionId);
      await loadData();
    } catch (error) {
      alert('Erro ao excluir sessão.');
    }
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
                      {session.finalBalance?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 
                       (session.initialBalance + operations.filter(op => op.sessionId === session.id).reduce((acc, op) => acc + (op.type === 'IN' ? op.amount : -op.amount), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
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
                      <p className="font-bold text-gray-700 dark:text-gray-200">{session.initialBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Entradas (Suprimentos)</p>
                      <p className="font-bold text-green-600">
                        {operations
                          .filter(op => op.sessionId === session.id && op.type === 'IN')
                          .reduce((acc, op) => acc + op.amount, 0)
                          .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Saídas (Sangrias)</p>
                      <p className="font-bold text-red-600">
                        {operations
                          .filter(op => op.sessionId === session.id && op.type === 'OUT')
                          .reduce((acc, op) => acc + op.amount, 0)
                          .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
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
                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                              .map(op => (
                                <tr key={op.id} className="group">
                                  <td className="py-3 text-gray-600 dark:text-gray-400">
                                    {safeFormat(op.timestamp, "HH:mm:ss")}
                                  </td>
                                  <td className="py-3">
                                    <span className={clsx(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                      op.type === 'IN' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                    )}>
                                      {op.type === 'IN' ? <ArrowUpCircle size={10} /> : <ArrowDownCircle size={10} />}
                                      {op.type === 'IN' ? 'Suprimento' : 'Sangria'}
                                    </span>
                                  </td>
                                  <td className="py-3 text-gray-700 dark:text-gray-300 font-medium">
                                    {op.description}
                                  </td>
                                  <td className={clsx(
                                    "py-3 text-right font-bold",
                                    op.type === 'IN' ? "text-green-600" : "text-red-600"
                                  )}>
                                    {op.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
};

export default CashManagement;
