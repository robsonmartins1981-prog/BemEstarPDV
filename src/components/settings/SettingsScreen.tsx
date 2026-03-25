import React, { useState, useEffect } from 'react';
import { db, exportFullBackup, importFullBackup, clearProductsAndInventory } from '../../services/databaseService';
import type { Shortcut, AppConfig, User } from '../../types';
import Button from '../shared/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings, Keyboard, Monitor, Building2, Save, 
  RefreshCw, Trash2, Plus, CheckCircle2, AlertCircle,
  Moon, Sun, Laptop, Smartphone, Download, Upload,
  Database as DbIcon, FolderOpen, Printer, Check, Eraser,
  User as UserIcon, Lock, Eye, EyeOff
} from 'lucide-react';

type SettingsTab = 'general' | 'profile' | 'printer' | 'database' | 'security' | 'shortcuts';

const SettingsScreen: React.FC = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile state
  const [profileData, setProfileData] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    fetchData();
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        cpf: user.cpf || ''
      });
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const configData = await db.get('appConfig', 'main');
      const shortcutData = await db.getAll('shortcuts');
      setConfig(configData || null);
      setShortcuts(shortcutData.sort((a, b) => a.key.localeCompare(b.key)));
      
      if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        const printerList = await ipcRenderer.invoke('list-printers');
        setPrinters(printerList);
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      // Update basic info
      const success = await updateUser(profileData);
      
      // Update password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'As senhas não coincidem.' });
          setIsUpdatingProfile(false);
          return;
        }
        if (newPassword.length < 6) {
          setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
          setIsUpdatingProfile(false);
          return;
        }
        await changePassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }

      if (success) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil.' });
    } finally {
      setIsUpdatingProfile(false);
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
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        const path = await ipcRenderer.invoke('select-directory');
        if (path) {
          setConfig(prev => prev ? { ...prev, localDatabasePath: path } : null);
        }
      } catch (error) {
        console.error('Erro ao selecionar diretório:', error);
        alert('Erro ao abrir seletor de pastas.');
      }
    } else {
      alert('Esta funcionalidade está disponível apenas na versão desktop instalada.');
    }
  };

  const handleClearData = async () => {
    setShowClearConfirm(true);
  };

  const executeClearData = async () => {
    if (confirmText !== 'LIMPAR') return;
    
    setIsClearing(true);
    setShowClearConfirm(false);
    setConfirmText('');
    try {
      await clearProductsAndInventory();
      setMessage({ type: 'success', text: 'Dados de produtos e estoque limpos com sucesso! Recarregando...' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao limpar dados do sistema.' });
    } finally {
      setIsClearing(false);
    }
  };

  const handleTestPrint = async () => {
    if (!config) return;
    
    const mockSale: any = {
      id: 'TESTE-' + Math.random().toString(36).substring(7),
      date: new Date().toISOString(),
      items: [
        { productName: 'PRODUTO DE TESTE', quantity: 1, unitPrice: 10, total: 10 }
      ],
      subtotal: 10,
      totalDiscount: 0,
      totalAmount: 10,
      payments: [{ method: 'DINHEIRO', amount: 10 }],
      change: 0
    };

    try {
      const { printReceipt } = await import('../../utils/printUtils');
      await printReceipt(mockSale, config);
      setMessage({ type: 'success', text: 'Teste de impressão enviado!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao testar impressão.' });
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

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'general', label: 'Geral', icon: Building2 },
    { id: 'profile', label: 'Meu Perfil', icon: UserIcon },
    { id: 'printer', label: 'Impressão', icon: Printer },
    { id: 'database', label: 'Banco de Dados', icon: DbIcon },
    { id: 'security', label: 'Segurança', icon: RefreshCw },
    { id: 'shortcuts', label: 'Atalhos', icon: Keyboard },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-4">
          <div className="bg-theme-primary/10 p-3 rounded-2xl text-theme-primary">
            <Settings size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Configurações</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personalize o sistema e seu perfil</p>
          </div>
        </div>
        {message.text && (
          <div className={`px-6 py-3 rounded-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all text-left shrink-0 lg:shrink ${activeTab === tab.id ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <tab.icon size={20} />
              <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-white dark:bg-gray-800 rounded-[32px] p-8 border dark:border-gray-700 shadow-sm min-h-full">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="text-theme-primary" size={24} />
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-800 dark:text-white">Configurações Gerais</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  </div>

                  <div className="space-y-6">
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

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">Auto-Adicionar Barcode</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Match exato no PDV</span>
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
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Sempre marcar impressão</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={config?.defaultPrintReceipt}
                          onChange={e => setConfig(prev => prev ? { ...prev, defaultPrintReceipt: e.target.checked } : null)}
                          className="w-6 h-6 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-gray-700">
                  <Button onClick={handleSaveConfig} className="px-12 py-4">
                    <Save size={20} className="mr-2" /> Salvar Configurações
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <UserIcon className="text-theme-primary" size={24} />
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-800 dark:text-white">Meu Perfil</h2>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-gray-700 pb-2">Informações Pessoais</h3>
                      
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nome Completo</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                          value={profileData.fullName}
                          onChange={e => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">CPF</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                            value={profileData.cpf}
                            onChange={e => setProfileData(prev => ({ ...prev, cpf: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Telefone</label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                            value={profileData.phone}
                            onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Endereço</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                          value={profileData.address}
                          onChange={e => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-gray-700 pb-2">Segurança da Conta</h3>
                      
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">E-mail de Acesso</label>
                        <input
                          type="email"
                          disabled
                          className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border dark:border-gray-700 rounded-2xl outline-none font-bold text-sm text-gray-500 cursor-not-allowed"
                          value={user?.email}
                        />
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 ml-1">O e-mail não pode ser alterado diretamente.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nova Senha</label>
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder="Deixe em branco para não alterar"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-4 top-[38px] text-gray-400 hover:text-theme-primary"
                          >
                            {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Confirmar Nova Senha</label>
                          <input
                            type={showPasswords ? 'text' : 'password'}
                            placeholder="Repita a nova senha"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t dark:border-gray-700">
                    <Button type="submit" isLoading={isUpdatingProfile} className="px-12 py-4">
                      <Save size={20} className="mr-2" /> Atualizar Perfil e Senha
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'printer' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <Printer className="text-theme-primary" size={24} />
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-800 dark:text-white">Configurações de Impressão</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase ml-1">Impressora Padrão</label>
                        <button 
                          onClick={fetchData} 
                          className="text-[9px] font-black uppercase text-theme-primary hover:underline flex items-center gap-1"
                        >
                          <RefreshCw size={10} /> Atualizar Lista
                        </button>
                      </div>
                      
                      {printers.length > 0 ? (
                        <select
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                          value={config?.printerName || ''}
                          onChange={e => setConfig(prev => prev ? { ...prev, printerName: e.target.value } : null)}
                        >
                          <option value="">Nenhuma (Usar Diálogo do Sistema)</option>
                          {printers.map(p => (
                            <option key={p.name} value={p.name}>{p.name} {p.isDefault ? '(Padrão)' : ''}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Nome da Impressora"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                            value={config?.printerName || ''}
                            onChange={e => setConfig(prev => prev ? { ...prev, printerName: e.target.value } : null)}
                          />
                          <Printer className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Largura do Papel</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['58mm', '80mm'].map(w => (
                          <button
                            key={w}
                            onClick={() => setConfig(prev => prev ? { ...prev, printerWidth: w as any } : null)}
                            className={`flex items-center justify-center p-3 rounded-2xl border-2 transition-all gap-2 ${config?.printerWidth === w ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 dark:border-gray-700 text-gray-400'}`}
                          >
                            {config?.printerWidth === w && <Check size={14} />}
                            <span className="text-[10px] font-black uppercase">{w}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">Impressão Automática</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Ao finalizar venda</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={config?.printAuto}
                          onChange={e => setConfig(prev => prev ? { ...prev, printAuto: e.target.checked } : null)}
                          className="w-6 h-6 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">Imprimir Logotipo</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">No topo do recibo</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={config?.printLogo}
                          onChange={e => setConfig(prev => prev ? { ...prev, printLogo: e.target.checked } : null)}
                          className="w-6 h-6 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleSaveConfig} className="flex-1 py-4">
                        <Save size={20} className="mr-2" /> Salvar
                      </Button>
                      <Button onClick={handleTestPrint} variant="secondary" className="flex-1 py-4">
                        <Printer size={20} className="mr-2" /> Testar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <DbIcon className="text-theme-primary" size={24} />
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-800 dark:text-white">Banco de Dados Local</h2>
                </div>
                
                <div className="max-w-2xl space-y-6">
                  <div className="p-6 bg-theme-primary/5 dark:bg-theme-primary/10 rounded-3xl border border-theme-primary/20">
                    <p className="text-[10px] font-black uppercase text-theme-primary mb-2">Operação 100% Offline</p>
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed uppercase">
                      O sistema opera de forma totalmente offline, utilizando o banco de dados local (IndexedDB). Seus dados são armazenados de forma segura em seu dispositivo e não são enviados para a nuvem.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Caminho da Pasta de Dados (Versão Windows Executável)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ex: C:\BemEstarPDV\Dados"
                          className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                          value={config?.localDatabasePath || ''}
                          onChange={e => setConfig(prev => prev ? { ...prev, localDatabasePath: e.target.value } : null)}
                        />
                        <Button variant="secondary" onClick={handleSelectDbPath}>
                          <FolderOpen size={20} />
                        </Button>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 ml-1">
                        Este caminho será utilizado para salvar o banco de dados quando o app estiver rodando como executável Windows.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <Button onClick={handleSaveConfig} className="py-4">
                      <Save size={20} className="mr-2" /> Salvar Caminho de Dados
                    </Button>
                    <Button onClick={handleBackup} variant="secondary" className="py-4 border-theme-primary/30">
                      <Download size={20} className="mr-2" /> Exportar Backup Manual
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <RefreshCw className="text-theme-primary" size={24} />
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-800 dark:text-white">Segurança e Dados</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-gray-700 pb-2">Backup e Restauração</h3>
                    
                    <Button onClick={handleBackup} variant="secondary" className="w-full py-4 justify-start px-6">
                      <Download size={20} className="mr-4" /> Exportar Backup Total
                    </Button>

                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Button variant="secondary" className="w-full py-4 justify-start px-6 pointer-events-none">
                        <Upload size={20} className="mr-4" /> Restaurar Backup
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b dark:border-gray-700 pb-2">Manutenção do Sistema</h3>
                    
                    <Button 
                      onClick={handleClearData} 
                      variant="secondary" 
                      className="w-full py-4 justify-start px-6 border-red-500/30 text-red-600 dark:text-red-400"
                      disabled={isClearing}
                    >
                      {isClearing ? (
                        <RefreshCw size={20} className="mr-4 animate-spin" />
                      ) : (
                        <Eraser size={20} className="mr-4" />
                      )}
                      Limpar Produtos e Estoque
                    </Button>

                    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-100 dark:border-red-800/30">
                      <p className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 mb-2">Aviso Crítico</p>
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed uppercase">
                        A limpeza de dados apagará permanentemente todos os produtos e registros de estoque. Certifique-se de ter um backup antes de prosseguir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <Keyboard className="text-theme-primary" size={24} />
                    <h2 className="text-xl font-black uppercase tracking-widest text-gray-800 dark:text-white">Atalhos de Teclado</h2>
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
                              <option value="PRINT_LAST_RECEIPT">Imprimir Último Cupom</option>
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação Perigosa */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[40px] p-10 shadow-2xl border-4 border-red-500/20 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="bg-red-500/10 p-6 rounded-full text-red-500 animate-pulse">
              <AlertCircle size={64} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-red-600 dark:text-red-400">Procedimento Perigoso</h2>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed uppercase">
                Você está prestes a apagar <span className="text-red-500 font-black">TODOS</span> os produtos, categorias, lotes e histórico de estoque. <br/>
                Esta ação é <span className="text-red-500 font-black underline">IRREVERSÍVEL</span>.
              </p>
            </div>

            <div className="w-full space-y-4">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Digite <span className="text-red-500">LIMPAR</span> para confirmar</p>
              <input 
                type="text" 
                className="w-full px-6 py-4 bg-gray-100 dark:bg-gray-900 border-2 border-transparent focus:border-red-500 rounded-2xl outline-none text-center font-black text-xl tracking-[0.5em] uppercase transition-all"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                autoFocus
                placeholder="---"
              />
            </div>

            <div className="flex gap-4 w-full pt-4">
              <Button 
                variant="secondary" 
                className="flex-1 py-6 text-xs font-black uppercase tracking-widest"
                onClick={() => { setShowClearConfirm(false); setConfirmText(''); }}
              >
                Cancelar
              </Button>
              <Button 
                className={`flex-1 py-6 text-xs font-black uppercase tracking-widest ${confirmText === 'LIMPAR' ? 'bg-red-600 hover:bg-red-700 text-white' : 'opacity-20 cursor-not-allowed'}`}
                disabled={confirmText !== 'LIMPAR'}
                onClick={executeClearData}
              >
                Confirmar Limpeza
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;
