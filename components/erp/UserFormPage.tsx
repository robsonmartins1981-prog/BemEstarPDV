
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { User, UserRole } from '../../types';
import Button from '../shared/Button';
import { Save, User as UserIcon, Lock, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface UserFormPageProps {
  userId?: string;
  onBack: () => void;
}

const UserFormPage: React.FC<UserFormPageProps> = ({ userId, onBack }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isLoading, setIsLoading] = useState(true);

    const modules = [
        { id: 'pos', label: 'PDV (Caixa e Vendas)', subModules: [] },
        { id: 'erp', label: 'ERP (Estoque e Financeiro)', subModules: [
            { id: 'erp:dre', label: 'Painel DRE / Lucro' },
            { id: 'erp:cashAudit', label: 'Controle de Caixa' },
            { id: 'erp:hr', label: 'Equipe e RH' },
            { id: 'erp:products', label: 'Produtos' },
            { id: 'erp:categories', label: 'Categorias' },
            { id: 'erp:inventory', label: 'Inventário e Validade' },
            { id: 'erp:generateOrder', label: 'Sugestão de Pedidos' },
            { id: 'erp:nfeImport', label: 'Importar NF-e XML' },
            { id: 'erp:customers', label: 'Base de Clientes' },
            { id: 'erp:personalFinance', label: 'Finanças Pessoais' },
            { id: 'erp:expenses', label: 'Contas a Pagar' },
            { id: 'erp:suppliers', label: 'Fornecedores (Credores)' },
            { id: 'erp:deliveryZones', label: 'Bairros e Fretes' },
            { id: 'erp:generalSettings', label: 'Geral e WhatsApp' },
        ] },
        { id: 'crm', label: 'CRM (Marketing e Clientes)', subModules: [
            { id: 'crm:customers', label: 'Base de Clientes' },
            { id: 'crm:segmentation', label: 'Segmentação' },
            { id: 'crm:campaigns', label: 'Campanhas' },
            { id: 'crm:automation', label: 'Automação' },
            { id: 'crm:coupons', label: 'Cupons' },
        ] },
        { id: 'fiscal', label: 'Fiscal (Configurações NFC-e)', subModules: [] },
    ];

    useEffect(() => {
        const fetchUser = async () => {
            if (userId) {
                const data = await db.get('users', userId);
                if (data) setFormData(data);
                else onBack();
            } else {
                setFormData({
                    id: uuidv4(),
                    username: '',
                    password: '',
                    role: 'OPERATOR',
                    permissions: ['pos'],
                    active: true
                });
            }
            setIsLoading(false);
        };
        fetchUser();
    }, [userId, onBack]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const togglePermission = (moduleId: string) => {
        const current = formData.permissions || [];
        let next = [...current];
        
        if (current.includes(moduleId)) {
            // Uncheck
            next = next.filter(p => p !== moduleId);
            // If it's a main module, also remove its sub-modules
            if (!moduleId.includes(':')) {
                next = next.filter(p => !p.startsWith(`${moduleId}:`));
            }
        } else {
            // Check
            next.push(moduleId);
            // If it's a main module, auto-check all its sub-modules
            if (!moduleId.includes(':')) {
                const moduleDef = modules.find(m => m.id === moduleId);
                if (moduleDef && moduleDef.subModules) {
                    moduleDef.subModules.forEach(sub => {
                        if (!next.includes(sub.id)) {
                            next.push(sub.id);
                        }
                    });
                }
            }
            // If it's a sub-module, ensure the main module is checked
            if (moduleId.includes(':')) {
                const mainModule = moduleId.split(':')[0];
                if (!next.includes(mainModule)) {
                    next.push(mainModule);
                }
            }
        }
        
        setFormData(prev => ({ ...prev, permissions: next }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            alert('Nome de usuário e senha são obrigatórios.');
            return;
        }

        await db.put('users', formData as User);
        onBack();
    };

    if (isLoading) return <div className="text-center p-12 animate-pulse font-black uppercase text-xs">Acessando cofre de acessos...</div>;

    const inputStyle = "mt-1 block w-full rounded-2xl border border-gray-200 py-3 px-4 shadow-sm focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 dark:border-gray-700 dark:bg-gray-800 transition-all outline-none font-bold";

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-5 mb-8">
                        <div className="p-4 bg-theme-primary/10 text-theme-primary rounded-2xl">
                            <UserIcon size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-gray-100">
                                {userId ? 'Editar Acessos' : 'Novo Usuário Operador'}
                            </h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Configuração de Identidade e Segurança</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-center gap-2 mb-2">
                             <input 
                                type="checkbox" 
                                name="active" 
                                id="active" 
                                checked={formData.active} 
                                onChange={handleChange} 
                                className="w-5 h-5 accent-theme-primary"
                            />
                            <label htmlFor="active" className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase">Usuário com acesso habilitado</label>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Username (Login)</label>
                            <input 
                                type="text" 
                                name="username" 
                                value={formData.username} 
                                onChange={handleChange} 
                                required 
                                disabled={formData.username === 'admin'}
                                className={inputStyle + (formData.username === 'admin' ? " opacity-50" : "")} 
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Senha de Acesso</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required 
                                    className={inputStyle + " pl-11 font-mono"} 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Papel (Nível)</label>
                            <select 
                                name="role" 
                                value={formData.role} 
                                onChange={handleChange} 
                                disabled={formData.username === 'admin'}
                                className={inputStyle + (formData.username === 'admin' ? " opacity-50" : "")}
                            >
                                <option value="OPERATOR">Operador (Acesso Limitado)</option>
                                <option value="ADMIN">Administrador (Gestão Total)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-6 pb-2 border-b">
                        <ShieldCheck size={16} className="text-theme-primary"/> Controle de Visibilidade de Módulos
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {modules.map(mod => {
                            const isSelected = formData.permissions?.includes(mod.id);
                            return (
                                <div key={mod.id} className={`flex flex-col rounded-2xl border-2 transition-all ${isSelected ? 'border-theme-primary bg-theme-primary/5 shadow-sm' : 'border-gray-100'}`}>
                                    <button
                                        type="button"
                                        onClick={() => togglePermission(mod.id)}
                                        className={`flex items-center justify-between p-4 text-left w-full ${isSelected ? 'text-theme-primary' : 'text-gray-400'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Permissão para</span>
                                            <span className="font-bold text-sm">{mod.label}</span>
                                        </div>
                                        {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                    </button>
                                    
                                    {isSelected && mod.subModules.length > 0 && (
                                        <div className="px-4 pb-4 pt-2 border-t border-theme-primary/20 flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Sub-módulos</span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {mod.subModules.map(sub => {
                                                    const isSubSelected = formData.permissions?.includes(sub.id);
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            type="button"
                                                            onClick={() => togglePermission(sub.id)}
                                                            className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-all text-left ${isSubSelected ? 'bg-theme-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                        >
                                                            {isSubSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                                            <span className="truncate">{sub.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" className="px-8 rounded-2xl" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary" className="px-12 rounded-2xl shadow-lg shadow-theme-primary/20">
                        <Save size={18} className="mr-2"/> Salvar Configurações
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UserFormPage;
