
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { StoreSettings } from '../../types';
import Button from '../shared/Button';
import { Save, Smartphone, Building, CheckCircle2 } from 'lucide-react';

const GeneralSettings: React.FC = () => {
    const [settings, setSettings] = useState<StoreSettings>({ id: 'main', whatsappNumber: '', storeName: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        db.get('storeSettings', 'main').then(data => {
            if (data) setSettings(data);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Remove caracteres não numéricos do WhatsApp
        const cleanWhatsapp = settings.whatsappNumber.replace(/\D/g, '');
        const updated = { ...settings, whatsappNumber: cleanWhatsapp };
        
        await db.put('storeSettings', updated);
        setSettings(updated);
        setIsSaving(false);
        setMsg('Configurações salvas com sucesso!');
        setTimeout(() => setMsg(''), 3000);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-theme-primary/10 text-theme-primary rounded-xl">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Configurações Gerais</h2>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Defina o destino dos pedidos e nome da loja</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nome do Estabelecimento</label>
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
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">WhatsApp Central (para receber pedidos)</label>
                            <div className="relative">
                                <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    value={settings.whatsappNumber}
                                    onChange={e => setSettings({...settings, whatsappNumber: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none font-mono"
                                    placeholder="Ex: 11999998888 (Apenas números)"
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic px-1">
                                * Este número será o destino quando você clicar em "Enviar WhatsApp" na tela de pedidos. Use o formato DDD + Número.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t dark:border-gray-700">
                        {msg && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm font-bold animate-in fade-in">
                                <CheckCircle2 size={16} /> {msg}
                            </div>
                        )}
                        <Button type="submit" variant="primary" className="w-full py-4" disabled={isSaving}>
                            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneralSettings;
