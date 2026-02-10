
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Employee } from '../../types';
import { ROLE_DEFINITIONS } from './HRManagement';
import Button from '../shared/Button';
import { Save, User, Briefcase, Calendar, Clock, LogIn, LogOut, Coffee, DollarSign, Umbrella, AlertTriangle, FileText, Phone, Smartphone, MapPin, BadgeCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface EmployeeFormPageProps {
  employeeId?: string;
  onBack: () => void;
}

const EmployeeFormPage: React.FC<EmployeeFormPageProps> = ({ employeeId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            setIsLoading(true);
            if (employeeId) {
                const data = await db.get('employees', employeeId);
                if (data) setFormData(data);
                else onBack();
            } else {
                setFormData({
                    id: uuidv4(),
                    name: '',
                    roleId: '',
                    salary: 0,
                    status: 'ACTIVE',
                    hireDate: new Date(),
                    shiftStart: '08:00',
                    lunchStart: '12:00',
                    lunchEnd: '13:00',
                    shiftEnd: '17:00',
                    cpf: '',
                    pis: '',
                    address: '',
                    phone: '',
                    cellphone: ''
                });
            }
            setIsLoading(false);
        };
        fetchEmployee();
    }, [employeeId, onBack]);

    // Cálculo de Férias
    const vacationStatus = useMemo(() => {
        if (!formData.hireDate) return null;
        
        const baseDate = formData.lastVacationDate ? new Date(formData.lastVacationDate) : new Date(formData.hireDate);
        const today = new Date();
        
        const diffInMs = today.getTime() - baseDate.getTime();
        const diffInMonths = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30.44));

        if (diffInMonths >= 12) {
            return { label: 'Férias Vencidas', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle, msg: `Colaborador está há ${diffInMonths} meses sem gozo de férias. Regularização Urgente!` };
        } else if (diffInMonths >= 11) {
            return { label: 'Férias a Vencer', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Clock, msg: 'Faltam menos de 30 dias para o vencimento do período concessivo.' };
        } else {
            return { label: 'Período Aquisitivo em Curso', color: 'text-theme-primary bg-theme-primary/5 border-theme-primary/10', icon: BadgeCheck, msg: `Colaborador possui ${diffInMonths} meses acumulados para o próximo período.` };
        }
    }, [formData.hireDate, formData.lastVacationDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else if (type === 'date') {
            setFormData(prev => ({ ...prev, [name]: new Date(value + 'T12:00:00') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.roleId || !formData.cpf) {
            alert('Nome, Cargo e CPF são obrigatórios para o registro.');
            return;
        }

        await db.put('employees', formData as Employee);
        onBack();
    };

    const formatDateForInput = (date?: Date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
    };

    if (isLoading) return <div className="text-center p-12 text-gray-400 font-black uppercase text-xs animate-pulse">Acessando banco de talentos...</div>;

    const inputStyle = "mt-1 block w-full rounded-xl border border-gray-200 py-3 px-4 shadow-sm focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 dark:border-gray-700 dark:bg-gray-800 transition-all outline-none font-bold text-sm";

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* CABEÇALHO DA FICHA */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-theme-primary/10 text-theme-primary rounded-2xl">
                            <User size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-gray-100">
                                {employeeId ? 'Ficha Funcional' : 'Admissão de Colaborador'}
                            </h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Bem Estar - Registro de Recursos Humanos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Status do Vínculo:</span>
                        <select 
                            name="status" 
                            value={formData.status} 
                            onChange={handleChange}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase outline-none border-none cursor-pointer ${formData.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                            <option value="ACTIVE">Ativo / No Quadro</option>
                            <option value="INACTIVE">Inativo / Desligado</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* COLUNA 1 & 2: DADOS, DOCUMENTAÇÃO E ENDEREÇO */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* BLOCO 1: DADOS BÁSICOS E DOCS */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-6 pb-2 border-b">
                                <Briefcase size={16} className="text-theme-primary"/> Identificação e Documentação
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome Completo</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} placeholder="Nome completo sem abreviações" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">CPF</label>
                                    <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} required className={inputStyle} placeholder="000.000.000-00" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">PIS / PASEP</label>
                                    <input type="text" name="pis" value={formData.pis} onChange={handleChange} className={inputStyle} placeholder="000.00000.00-0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Cargo / Função</label>
                                    <select name="roleId" value={formData.roleId} onChange={handleChange} required className={inputStyle}>
                                        <option value="">Selecione a função...</option>
                                        {ROLE_DEFINITIONS.map(r => (
                                            <option key={r.id} value={r.id}>{r.title} ({r.level})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Salário Base (CLT)</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="number" step="0.01" name="salary" value={formData.salary} onChange={handleChange} className={inputStyle + " pl-10 font-mono"} required />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BLOCO 2: CONTATO E ENDEREÇO */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-6 pb-2 border-b">
                                <Phone size={16} className="text-theme-primary"/> Contato e Localização
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Telefone Fixo / Contato</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputStyle + " pl-10"} placeholder="(00) 0000-0000" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Celular (WhatsApp)</label>
                                    <div className="relative">
                                        <Smartphone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" name="cellphone" value={formData.cellphone} onChange={handleChange} className={inputStyle + " pl-10"} placeholder="(00) 90000-0000" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Endereço Residencial Completo</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputStyle + " pl-10"} placeholder="Rua, Número, Bairro, Cidade - UF" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BLOCO 3: DATAS E FÉRIAS */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest mb-6 pb-2 border-b">
                                <Umbrella size={16} className="text-theme-primary"/> Cronograma de Férias e Contrato
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Data de Admissão</label>
                                    <input type="date" name="hireDate" value={formatDateForInput(formData.hireDate)} onChange={handleChange} className={inputStyle} required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Data do Último Gozo</label>
                                    <input type="date" name="lastVacationDate" value={formatDateForInput(formData.lastVacationDate)} onChange={handleChange} className={inputStyle} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Previsão de Término</label>
                                    <input type="date" name="contractEndDate" value={formatDateForInput(formData.contractEndDate)} onChange={handleChange} className={inputStyle} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA 3: JORNADA E AVISOS */}
                    <div className="space-y-6">
                        
                        {/* AVISO DE FÉRIAS INTELIGENTE */}
                        {vacationStatus && (
                            <div className={`p-6 rounded-3xl border-2 shadow-sm animate-in fade-in zoom-in-95 ${vacationStatus.color}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <vacationStatus.icon size={24} />
                                    <h4 className="font-black uppercase text-sm tracking-tight">{vacationStatus.label}</h4>
                                </div>
                                <p className="text-[11px] font-bold leading-relaxed uppercase opacity-80">
                                    {vacationStatus.msg}
                                </p>
                                <div className="mt-4 pt-3 border-t border-current border-opacity-10 text-[9px] font-black uppercase tracking-widest">
                                    Base legal: Art. 134 da CLT
                                </div>
                            </div>
                        )}

                        <div className="bg-theme-darkblue p-6 rounded-3xl shadow-xl text-white">
                            <h3 className="flex items-center gap-2 text-xs font-black text-white/50 uppercase tracking-widest mb-6 pb-2 border-b border-white/10">
                                <Clock size={16} className="text-theme-green"/> Jornada Contratual
                            </h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[9px] font-black text-white/40 uppercase mb-1 flex items-center gap-1"><LogIn size={10}/> Entrada</label>
                                        <input type="time" name="shiftStart" value={formData.shiftStart} onChange={handleChange} className="w-full bg-white/10 border-none rounded-xl py-2 px-3 text-sm font-mono outline-none focus:ring-2 focus:ring-theme-green" />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-white/40 uppercase mb-1 flex items-center gap-1"><LogOut size={10}/> Saída</label>
                                        <input type="time" name="shiftEnd" value={formData.shiftEnd} onChange={handleChange} className="w-full bg-white/10 border-none rounded-xl py-2 px-3 text-sm font-mono outline-none focus:ring-2 focus:ring-theme-green" />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <label className="block text-[9px] font-black text-white/40 uppercase mb-2 flex items-center gap-1"><Coffee size={10}/> Intervalo</label>
                                    <div className="flex items-center gap-2">
                                        <input type="time" name="lunchStart" value={formData.lunchStart} onChange={handleChange} className="flex-1 bg-white/10 border-none rounded-xl py-2 px-3 text-sm font-mono outline-none" />
                                        <span className="text-xs font-bold text-white/20">/</span>
                                        <input type="time" name="lunchEnd" value={formData.lunchEnd} onChange={handleChange} className="flex-1 bg-white/10 border-none rounded-xl py-2 px-3 text-sm font-mono outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-3xl border border-gray-200 dark:border-gray-700">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Histórico de Tempo</h4>
                             <p className="text-xl font-black text-gray-700 dark:text-gray-300">
                                {formData.hireDate ? 
                                    `${Math.floor((new Date().getTime() - new Date(formData.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} anos ` +
                                    `e ${Math.floor(((new Date().getTime() - new Date(formData.hireDate).getTime()) % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))} meses`
                                : '--'}
                             </p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Tempo total de dedicação à empresa</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" className="px-8 rounded-2xl" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary" className="px-12 rounded-2xl shadow-lg shadow-theme-primary/20">
                        <Save size={18} className="mr-2"/> Salvar Ficha Funcional
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeFormPage;
