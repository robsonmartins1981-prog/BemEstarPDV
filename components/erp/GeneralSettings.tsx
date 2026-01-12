
// components/erp/GeneralSettings.tsx
import React, { useState, useEffect, useRef } from 'react';
import { db, exportFullBackup, importFullBackup } from '../../services/databaseService';
import type { StoreSettings } from '../../types';
import Button from '../shared/Button';
import { Save, Smartphone, Building, CheckCircle2, Database, Download, Upload, AlertTriangle, ShieldCheck } from 'lucide-react';

const GeneralSettings: React.FC = () => {
    const [settings, setSettings] = useState<StoreSettings>({ id: 'main', whatsappNumber: '', storeName: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [backupMsg, setBackupMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        db.get('storeSettings', 'main').then(data => {
            if (data) setSettings(data);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const cleanWhatsapp = settings.whatsappNumber.replace(/\D/g, '');
        const updated = { ...settings, whatsappNumber: cleanWhatsapp };
        
        await db.put('storeSettings', updated);
        setSettings(updated);
        setIsSaving(false);
        setMsg('Configurações salvas com sucesso!');
        setTimeout(() => setMsg(''), 3000);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm("Isso irá mesclar os dados do arquivo com o sistema atual. IDs duplicados serão atualizados com a versão do arquivo. Deseja continuar?")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                await importFullBackup(content);
                setBackupMsg('Backup restaurado com sucesso! Recarregando dados...');
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) {
                alert('Erro ao importar backup. Arquivo inválido.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* CONFIGURAÇÕES GERAIS */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-theme-primary/10 text-theme-primary rounded-xl">
                        <Building size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Identidade da Loja</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Dados básicos do estabelecimento</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nome Fantasia</label>
                            <div className="relative">
                                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={settings.storeName}
                                    onChange={e => setSettings({...settings, storeName: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none"
                                    placeholder="Ex: BemEstar Matriz"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">WhatsApp de Pedidos</label>
                            <div className="relative">
                                <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={settings.whatsappNumber}
                                    onChange={e => setSettings({...settings, whatsappNumber: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none font-mono"
                                    placeholder="Ex: 11999998888"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t dark:border-gray-700">
                        {msg && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm font-bold animate-in fade-in">
                                <CheckCircle2 size={16} /> {msg}
                            </div>
                        )}
                        <Button type="submit" variant="primary" className="w-full py-4 rounded-xl" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </div>

            {/* SISTEMA DE BACKUP TOTAL */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Database size={120} />
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Cofre de Dados (Backup)</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Backup total e restauração incremental</p>
                    </div>
                </div>

                <div className="p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-xl mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-tight">Segurança da Informação</p>
                            <p className="text-[10px] font-bold mt-1 leading-relaxed uppercase">
                                Este backup inclui: Produtos, Categorias, Equipe, Vendas, Histórico de Caixa, Clientes e Configurações de Frete. IDs duplicados serão mesclados, evitando duplicidade e mantendo o histórico íntegro.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl hover:border-theme-primary/30 transition-all group">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-3 flex items-center gap-2">
                             <Download size={14} className="text-theme-primary" /> Exportar Dados
                        </h3>
                        <p className="text-[10px] text-gray-500 mb-4 leading-relaxed font-bold uppercase">
                            Gera um arquivo .JSON com toda a inteligência do seu negócio para salvaguarda externa.
                        </p>
                        <Button variant="secondary" className="w-full !py-3 rounded-xl border-gray-200" onClick={exportFullBackup}>
                            Gerar Arquivo de Backup
                        </Button>
                    </div>

                    <div className="p-4 border-2 border-gray-100 dark:border-gray-700 rounded-2xl hover:border-blue-500/30 transition-all">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-3 flex items-center gap-2">
                             <Upload size={14} className="text-blue-500" /> Restaurar / Atualizar
                        </h3>
                        <p className="text-[10px] text-gray-500 mb-4 leading-relaxed font-bold uppercase">
                            Importa um backup anterior. Se o item já existir, será atualizado. Novos itens serão adicionados.
                        </p>
                        <input 
                            type="file" 
                            accept=".json" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleImport}
                        />
                        <Button 
                            variant="secondary" 
                            className="w-full !py-3 rounded-xl border-gray-200"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Selecionar Arquivo
                        </Button>
                    </div>
                </div>

                {backupMsg && (
                    <div className="mt-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-bounce">
                        <ShieldCheck size={20} />
                        <span className="font-black text-xs uppercase tracking-tight">{backupMsg}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeneralSettings;
