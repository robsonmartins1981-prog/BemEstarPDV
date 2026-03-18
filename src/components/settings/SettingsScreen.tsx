
import React, { useState, useEffect } from 'react';
import { db, exportFullBackup, importFullBackup } from '../../services/databaseService';
import { sqliteStore } from '../../services/sqliteService';
import type { Shortcut, AppConfig } from '../../types';
import Button from '../shared/Button';
import { 
  Settings, Keyboard, Monitor, Building2, Save, 
  RefreshCw, Trash2, Plus, CheckCircle2, AlertCircle,
  Moon, Sun, Laptop, Smartphone, Download, Upload,
  Database as DbIcon, FolderOpen
} from 'lucide-react';

const SettingsScreen: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [dbPath, setDbPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const configData = await db.get('appConfig', 'main');
      const shortcutData = await db.getAll('shortcuts');
      setConfig(configData || null);
      setShortcuts(shortcutData.sort((a, b) => a.key.localeCompare(b.key)));
      
      // Busca config do Electron se disponível
      if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        const electronConfig = await ipcRenderer.invoke('get-db-config');
        setDbPath(electronConfig.dbPath);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      await db.put('appConfig', config);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    }
  };

  const handleBackup = async () => {
    try {
      await exportFullBackup();
      setMessage({ type: 'success', text: 'Backup exportado com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao exportar backup.' });
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm('Atenção: A restauração irá sobrescrever os dados atuais. Deseja continuar?')) return;

    try {
      const content = await file.text();
      await importFullBackup(content);
      setMessage({ type: 'success', text: 'Backup restaurado com sucesso! Recarregando...' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao restaurar backup. Verifique o arquivo.' });
    }
  };

  const handleSelectDbPath = async () => {
    if (!(window as any).require) {
      alert('Esta funcionalidade está disponível apenas na versão Desktop.');
      return;
    }

    const { ipcRenderer } = (window as any).require('electron');
    const path = await ipcRenderer.invoke('select-directory');
    
    if (path) {
      const result = await ipcRenderer.invoke('set-db-path', path);
      if (result.success) {
        setDbPath(path);
        setMessage({ type: 'success', text: 'Local do banco de dados atualizado!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao conectar no banco: ' + result.error });
      }
    }
  };

  const handleSyncProducts = async () => {
    try {
      const products = await db.getAll('products');
      await sqliteStore.syncProducts(products);
      setMessage({ type: 'success', text: 'Produtos sincronizados com o SQLite!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao sincronizar produtos.' });
    }
  };

  const handleUpdateShortcut = async (id: string, updates: Partial<Shortcut>) => {
    const shortcut = (shortcuts || []).find(s => s.id === id);
    if (!shortcut) return;
    
    const updated = { ...shortcut, ...updates };
    await db.put('shortcuts', updated);
    setShortcuts(prev => prev.map(s => s.id === id ? updated : s));
  };

  const handleDeleteShortcut = async (id: string) => {
    if (window.confirm('Excluir este atalho?')) {
      await db.delete('shortcuts', id);
      setShortcuts(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleAddShortcut = async () => {
    const newShortcut: Shortcut = {
      id: crypto.randomUUID(),
      key: 'F8',
      action: 'NONE',
      label: 'Novo Atalho'
    };
    await db.add('shortcuts', newShortcut);
    setShortcuts(prev => [...prev, newShortcut]);
  };

  if (loading) return <div className="p-8 text-center animate-pulse font-black uppercase text-gray-400">Carregando Configurações...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-theme-primary/10 p-3 rounded-2xl text-theme-primary">
            <Settings size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Configurações do Sistema</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personalize sua experiência de uso</p>
          </div>
        </div>
        {message.text && (
          <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* General Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="text-theme-primary" size={24} />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Geral</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nome da Empresa</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                  value={config?.companyName}
                  onChange={e => setConfig(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">WhatsApp para Delivery</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="55..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                    value={config?.whatsappNumber || ''}
                    onChange={e => setConfig(prev => prev ? { ...prev, whatsappNumber: e.target.value } : null)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">Auto-Adicionar Barcode</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Adiciona ao carrinho se houver match exato</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.autoAddOnBarcodeMatch}
                    onChange={e => setConfig(prev => prev ? { ...prev, autoAddOnBarcodeMatch: e.target.checked } : null)}
                    className="w-6 h-6 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">Imprimir Recibo Padrão</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Sempre marcar opção de impressão</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config?.defaultPrintReceipt}
                    onChange={e => setConfig(prev => prev ? { ...prev, defaultPrintReceipt: e.target.checked } : null)}
                    className="w-6 h-6 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Tema Visual</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light', icon: Sun, label: 'Claro' },
                    { id: 'dark', icon: Moon, label: 'Escuro' },
                    { id: 'system', icon: Laptop, label: 'Sistema' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setConfig(prev => prev ? { ...prev, theme: t.id as any } : null)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1 ${config?.theme === t.id ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                    >
                      <t.icon size={18} />
                      <span className="text-[9px] font-black uppercase">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveConfig} className="w-full py-4">
                <Save size={20} className="mr-2" /> Salvar Alterações
              </Button>
            </div>
          </div>

          {/* Database Path Section */}
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <DbIcon className="text-theme-primary" size={24} />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Banco de Dados Local (Rede)</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Caminho Atual:</p>
                <p className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300 break-all">
                  {dbPath || 'Não configurado (Usando IndexedDB local)'}
                </p>
              </div>
              
              <Button onClick={handleSelectDbPath} variant="secondary" className="w-full py-4">
                <FolderOpen size={20} className="mr-2" /> Selecionar Pasta na Rede
              </Button>

              {dbPath && (
                <Button onClick={handleSyncProducts} variant="secondary" className="w-full py-4 border-theme-primary/30 text-theme-primary">
                  <RefreshCw size={20} className="mr-2" /> Sincronizar Produtos p/ SQLite
                </Button>
              )}
              
              <p className="text-[9px] font-bold text-gray-400 uppercase text-center leading-relaxed">
                Recomendado: Selecione uma pasta em um servidor local para <br/>
                compartilhar os dados entre múltiplos terminais.
              </p>
            </div>
          </div>

          {/* Backup Section */}
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 border dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="text-theme-primary" size={24} />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Segurança e Dados</h2>
            </div>
            
            <div className="space-y-4">
              <Button onClick={handleBackup} variant="secondary" className="w-full py-4">
                <Download size={20} className="mr-2" /> Exportar Backup Total
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button variant="secondary" className="w-full py-4 pointer-events-none">
                  <Upload size={20} className="mr-2" /> Restaurar Backup
                </Button>
              </div>
              
              <p className="text-[9px] font-bold text-gray-400 uppercase text-center leading-relaxed">
                O backup inclui produtos, vendas, clientes e configurações. <br/>
                Arquivos de backup são salvos em formato JSON.
              </p>
            </div>
          </div>
        </div>

        {/* Shortcuts Config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 border dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Keyboard className="text-theme-primary" size={24} />
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-white">Atalhos de Teclado (F1-F10)</h2>
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddShortcut}>
                <Plus size={16} className="mr-2" /> Novo Atalho
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b dark:border-gray-700">
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tecla</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rótulo</th>
                    <th className="pb-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {shortcuts.map(s => (
                    <tr key={s.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="py-4 pr-4">
                        <select
                          className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl px-3 py-2 text-xs font-black text-theme-primary outline-none focus:ring-2 focus:ring-theme-primary/20"
                          value={s.key}
                          onChange={e => handleUpdateShortcut(s.id, { key: e.target.value })}
                        >
                          {['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'Insert', 'Delete', 'Home', 'End'].map(k => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 pr-4">
                        <select
                          className="bg-gray-100 dark:bg-gray-700 border-none rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-theme-primary/20 w-full"
                          value={s.action}
                          onChange={e => handleUpdateShortcut(s.id, { action: e.target.value })}
                        >
                          <option value="NONE">Nenhuma</option>
                          <option value="FINALIZE_SALE">Finalizar Venda (Pagar)</option>
                          <option value="OPEN_CUSTOMER_MODAL">Adicionar Cliente</option>
                          <option value="OPEN_PRODUCT_SEARCH">Pesquisar Produto</option>
                          <option value="PARK_SALE">Salvar Pedido (Estacionar)</option>
                          <option value="OPEN_CASH_OPS">Movimentar Caixa</option>
                          <option value="CLEAR_CART">Limpar Carrinho</option>
                          <option value="OPEN_SETTINGS">Configurações</option>
                          <option value="LOGOUT">Fechar Caixa / Sair</option>
                        </select>
                      </td>
                      <td className="py-4 pr-4">
                        <input
                          type="text"
                          className="bg-transparent border-none rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-theme-primary/20 w-full"
                          value={s.label}
                          onChange={e => handleUpdateShortcut(s.id, { label: e.target.value })}
                        />
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => handleDeleteShortcut(s.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/30 flex gap-4">
              <AlertCircle size={24} className="text-blue-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase text-blue-700 dark:text-blue-400 tracking-tight">Dica de Produtividade</p>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-500 leading-relaxed uppercase">
                  Use a tecla <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded font-black">ENTER</span> para avançar rapidamente entre os campos. O sistema focará automaticamente no próximo input lógico.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
