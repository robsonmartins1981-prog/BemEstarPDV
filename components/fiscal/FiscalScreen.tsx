
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { FiscalConfig, EmitenteConfig, ApiConfig, NfceConfig } from '../../types';
import FormEmitente from './tabs/FormEmitente';
import FormApiCertificado from './tabs/FormApiCertificado';
import FormNfce from './tabs/FormNfce';
import Button from '../shared/Button';
import { Building, KeyRound, ReceiptText, Save } from 'lucide-react';

interface FiscalScreenProps {
    setView: (view: 'pos' | 'erp' | 'crm' | 'fiscal') => void;
}

// Valor inicial para a configuração, caso nenhuma exista no banco de dados.
const initialFiscalConfig: FiscalConfig = {
    id: 'main',
    emitente: {
        cnpj: '', razaoSocial: '', nomeFantasia: '', inscricaoEstadual: '',
        logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '',
        codigoIbgeCidade: '', regimeTributario: 'SimplesNacional',
    },
    api: {
        provedorApi: 'TecnoSpeed', apiKey: '', apiSecret: '',
    },
    nfce: {
        ambiente: 'Homologacao', serieNFCe: 1, proximoNumeroNFCe: 1,
        cscId: '', cscToken: '',
    }
};

// Componente principal para a tela de Configurações Fiscais.
const FiscalScreen: React.FC<FiscalScreenProps> = ({ setView }) => {
    const [config, setConfig] = useState<FiscalConfig | null>(null);
    const [activeTab, setActiveTab] = useState<'emitente' | 'api' | 'nfce'>('emitente');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Busca a configuração do banco de dados ao carregar o componente.
    useEffect(() => {
        const fetchConfig = async () => {
            let fiscalConfig = await db.get('fiscalConfig', 'main');
            if (!fiscalConfig) {
                fiscalConfig = initialFiscalConfig;
            }
            setConfig(fiscalConfig);
        };
        fetchConfig();
    }, []);

    const handleSaveConfig = async () => {
        if (!config) return;
        setIsSaving(true);
        setSaveMessage('');
        try {
            await db.put('fiscalConfig', config);
            setSaveMessage('Configurações salvas com sucesso!');
            setTimeout(() => setSaveMessage(''), 3000); // Limpa a mensagem após 3 segundos
        } catch (error) {
            console.error("Erro ao salvar configurações fiscais:", error);
            setSaveMessage('Erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };
    
    // Funções "parciais" para atualizar o estado.
    // Isso evita passar o 'setConfig' inteiro para os filhos, tornando a passagem de props mais explícita.
    const updateEmitente = (data: EmitenteConfig) => setConfig(prev => prev ? { ...prev, emitente: data } : null);
    const updateApi = (data: ApiConfig) => setConfig(prev => prev ? { ...prev, api: data } : null);
    const updateNfce = (data: NfceConfig) => setConfig(prev => prev ? { ...prev, nfce: data } : null);
    
    const tabs = [
        { id: 'emitente', label: '1. Emitente', icon: Building },
        { id: 'api', label: '2. Conexão/Certificado', icon: KeyRound },
        { id: 'nfce', label: '3. Padrões NFC-e', icon: ReceiptText },
    ];
    
    if (!config) {
        return <div className="flex h-full items-center justify-center">Carregando configurações...</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 h-full overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
                <h1 className="text-xl md:text-2xl font-bold">Configurações Fiscais</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Preencha os dados da sua empresa e da API para habilitar a emissão de notas fiscais (NFC-e).
                </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
                {/* Abas de Navegação - Scrollable on mobile */}
                <div className="border-b border-gray-200 dark:border-gray-700 w-full overflow-x-auto">
                    <nav className="-mb-px flex space-x-4 px-4 md:px-6 min-w-max" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-theme-primary text-theme-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Conteúdo das Abas */}
                <div className="p-4 md:p-6 flex-grow">
                    {activeTab === 'emitente' && <FormEmitente data={config.emitente} onChange={updateEmitente} />}
                    {activeTab === 'api' && <FormApiCertificado data={config.api} onChange={updateApi} />}
                    {activeTab === 'nfce' && <FormNfce data={config.nfce} onChange={updateNfce} />}
                </div>

                {/* Botão de Salvar Fixo */}
                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-3">
                    <span className={`text-sm font-medium order-2 md:order-1 ${saveMessage.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>{saveMessage}</span>
                    <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full md:w-auto order-1 md:order-2">
                        <Save size={16} />
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default FiscalScreen;
