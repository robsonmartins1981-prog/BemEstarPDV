
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Employee } from '../../types';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { PlusCircle, Edit, Trash2, UserCog, Calendar, DollarSign, BadgeCheck, XCircle, Info, Umbrella, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface RoleDetail {
    id: string;
    level: 'ESTRATEGICO' | 'TATICO' | 'OPERACIONAL';
    title: string;
    mission: string;
    functions: string[];
}

const ROLE_DEFINITIONS: RoleDetail[] = [
    {
        id: 'gerente_geral',
        level: 'ESTRATEGICO',
        title: 'Gerente Geral',
        mission: 'Garantir o lucro e o crescimento sustentável da loja.',
        functions: ['Gestão Financeira (Fluxo de caixa, DRE)', 'Compras Estratégicas', 'Marketing Macro', 'Gestão de Pessoas']
    },
    {
        id: 'sup_vendas',
        level: 'TATICO',
        title: 'Supervisora de Operações e Vendas',
        mission: 'Foco no chão de loja, equipe de vendas e reposição.',
        functions: ['Evitar rupturas (faltas)', 'Monitorar atendimento', 'Auditar setor a granel', 'Treinar novos vendedores']
    },
    {
        id: 'sup_adm',
        level: 'TATICO',
        title: 'Supervisora Administrativa e Frente de Caixa',
        mission: 'Foco em processos, dinheiro e digital.',
        functions: ['Gestão da frente de caixa', 'Supervisão do WhatsApp', 'Controle de rotinas (Ponto/Uniformes)', 'Resolução de trocas/reclamações']
    },
    {
        id: 'consultor_vendas',
        level: 'OPERACIONAL',
        title: 'Consultor de Vendas',
        mission: 'Venda consultiva com conhecimento técnico sobre saúde.',
        functions: ['Explicar suplementos/chás', 'Abastecimento e FIFO', 'Limpeza do granel', 'Fidelização no salão']
    },
    {
        id: 'operador_caixa',
        level: 'OPERACIONAL',
        title: 'Operador de Caixa',
        mission: 'Processamento rápido e coleta de dados para CRM.',
        functions: ['Rapidez nas vendas', 'Cadastro obrigatório (CRM)', 'Venda sugestiva (Check-out)', 'Fechamento sem quebras']
    },
    {
        id: 'vendedor_digital',
        level: 'OPERACIONAL',
        title: 'Vendedor Digital / SDR (WhatsApp)',
        mission: 'Atendimento ativo e receptivo no WhatsApp Business.',
        functions: ['Gestão de Listas de Transmissão', 'Logística de entregas', 'Recuperação de vendas perdidas']
    },
    {
        id: 'estoquista',
        level: 'OPERACIONAL',
        title: 'Estoquista / Recebimento',
        mission: 'Conferência cega e organização do pulmão.',
        functions: ['Conferência físico x nota', 'Armazenamento organizado', 'Controle de validade', 'Separação para lanchonete']
    },
    {
        id: 'atendente_lanchonete',
        level: 'OPERACIONAL',
        title: 'Atendente de Lanchonete',
        mission: 'Preparo de alimentos fit e atendimento ágil.',
        functions: ['Sucos, shakes e omeletes', 'Atendimento de mesas/balcão', 'Controle de desperdício', 'Higienização da copa']
    },
    {
        id: 'auxiliar_aprendiz',
        level: 'OPERACIONAL',
        title: 'Auxiliar de Apoio / Aprendiz',
        mission: 'Suporte logístico e visual para marketing.',
        functions: ['Entregas próximas', 'Apoio na reposição', 'Fotos para marketing', 'Limpeza geral']
    }
];

const HRManagement: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Partial<Employee> | null>(null);
    const [expandedInfo, setExpandedInfo] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        const allEmployees = await db.getAll('employees');
        setEmployees(allEmployees.sort((a, b) => a.name.localeCompare(b.name)));
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEmployee?.name || !editingEmployee?.roleId || editingEmployee?.salary === undefined) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        const employeeData: Employee = {
            id: editingEmployee.id || uuidv4(),
            name: editingEmployee.name,
            roleId: editingEmployee.roleId,
            salary: editingEmployee.salary,
            status: editingEmployee.status || 'ACTIVE',
            hireDate: editingEmployee.hireDate || new Date(),
            contractEndDate: editingEmployee.contractEndDate,
            lastVacationDate: editingEmployee.lastVacationDate,
        };

        await db.put('employees', employeeData);
        setIsModalOpen(false);
        setEditingEmployee(null);
        fetchEmployees();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Deseja realmente remover este funcionário?')) {
            await db.delete('employees', id);
            fetchEmployees();
        }
    };

    const toggleStatus = async (employee: Employee) => {
        const updated = { ...employee, status: employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
        await db.put('employees', updated as Employee);
        fetchEmployees();
    };

    // Lógica CLT: Férias vencem 1 ano após admissão (ou últimas férias). Aviso com 11 meses.
    const getVacationStatus = (emp: Employee) => {
        const baseDate = emp.lastVacationDate ? new Date(emp.lastVacationDate) : new Date(emp.hireDate);
        const today = new Date();
        
        // Calcula diferença em meses
        const months = (today.getFullYear() - baseDate.getFullYear()) * 12 + (today.getMonth() - baseDate.getMonth());
        
        if (months >= 11) {
            return { 
                alert: true, 
                msg: months >= 12 ? 'Férias Vencidas!' : 'Férias a vencer (11 meses)', 
                months 
            };
        }
        return { alert: false, months };
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Gestão de Equipe</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manual de Cargos e Controle CLT</p>
                </div>
                <Button onClick={() => { setEditingEmployee({ hireDate: new Date() }); setIsModalOpen(true); }}>
                    <PlusCircle size={18}/> Novo Funcionário
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {employees.map(emp => {
                    const role = ROLE_DEFINITIONS.find(r => r.id === emp.roleId);
                    const vacation = getVacationStatus(emp);
                    const isExpanded = expandedInfo === emp.id;

                    return (
                        <div key={emp.id} className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border-2 transition-all ${emp.status === 'ACTIVE' ? 'border-transparent' : 'border-gray-200 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-full ${role?.level === 'ESTRATEGICO' ? 'bg-purple-100 text-purple-600' : role?.level === 'TATICO' ? 'bg-blue-100 text-blue-600' : 'bg-theme-primary/10 text-theme-primary'}`}>
                                        <UserCog size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase text-sm leading-tight">{emp.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{role?.title || 'Cargo não definido'}</p>
                                            <span className="text-[8px] px-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-500 font-bold">{role?.level}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                                    </span>
                                    {vacation.alert && (
                                        <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse ${vacation.months >= 12 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                            <AlertTriangle size={10} /> {vacation.msg}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Salário Base</p>
                                    <p className="font-mono font-bold text-theme-primary text-sm">{formatCurrency(emp.salary)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Admissão</p>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{new Date(emp.hireDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                {emp.contractEndDate && (
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase">Término Contrato</p>
                                        <p className="text-xs font-bold text-orange-600">{new Date(emp.contractEndDate).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Período Aquisitivo</p>
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{vacation.months} meses trab.</p>
                                </div>
                            </div>

                            {/* Detalhes do Cargo Expandíveis */}
                            <div className="mb-4">
                                <button 
                                    onClick={() => setExpandedInfo(isExpanded ? null : emp.id)}
                                    className="flex items-center gap-1 text-[10px] font-black text-theme-primary uppercase hover:underline"
                                >
                                    {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} 
                                    {isExpanded ? 'Ocultar Responsabilidades' : 'Ver Missão e Funções'}
                                </button>
                                {isExpanded && role && (
                                    <div className="mt-2 p-3 border-l-2 border-theme-primary bg-theme-primary/5 rounded-r-lg space-y-2 animate-in fade-in slide-in-from-top-1">
                                        <p className="text-[10px] text-gray-600 dark:text-gray-400 italic">" {role.mission} "</p>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                            {role.functions.map((f, i) => (
                                                <li key={i} className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase">
                                                    <BadgeCheck size={10} className="text-theme-primary" /> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                                <Button variant="secondary" className="flex-1 !p-2 h-auto" onClick={() => { setEditingEmployee(emp); setIsModalOpen(true); }}>
                                    <Edit size={16}/>
                                </Button>
                                <button 
                                    onClick={() => toggleStatus(emp)}
                                    title={emp.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                                    className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-colors ${emp.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                >
                                    {emp.status === 'ACTIVE' ? <XCircle size={18}/> : <BadgeCheck size={18}/>}
                                </button>
                                <Button variant="danger" className="flex-1 !p-2 h-auto" onClick={() => handleDelete(emp.id)}>
                                    <Trash2 size={16}/>
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingEmployee?.id ? 'Editar Ficha do Colaborador' : 'Nova Contratação'}
            >
                <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nome Completo</label>
                            <input 
                                type="text" 
                                value={editingEmployee?.name || ''} 
                                onChange={e => setEditingEmployee(p => ({...p!, name: e.target.value}))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Cargo e Responsabilidades</label>
                            <select 
                                value={editingEmployee?.roleId || ''} 
                                onChange={e => setEditingEmployee(p => ({...p!, roleId: e.target.value}))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none"
                                required
                            >
                                <option value="">Selecione o cargo...</option>
                                {ROLE_DEFINITIONS.map(r => (
                                    <option key={r.id} value={r.id}>{r.title} ({r.level})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Salário Base (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={editingEmployee?.salary || ''} 
                                onChange={e => setEditingEmployee(p => ({...p!, salary: parseFloat(e.target.value)}))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none font-mono"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Data de Admissão</label>
                            <input 
                                type="date" 
                                value={editingEmployee?.hireDate ? new Date(editingEmployee.hireDate).toISOString().split('T')[0] : ''} 
                                onChange={e => setEditingEmployee(p => ({...p!, hireDate: new Date(e.target.value)}))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Término de Contrato (Opcional)</label>
                            <input 
                                type="date" 
                                value={editingEmployee?.contractEndDate ? new Date(editingEmployee.contractEndDate).toISOString().split('T')[0] : ''} 
                                onChange={e => setEditingEmployee(p => ({...p!, contractEndDate: new Date(e.target.value)}))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Últimas Férias Gozadas</label>
                            <input 
                                type="date" 
                                value={editingEmployee?.lastVacationDate ? new Date(editingEmployee.lastVacationDate).toISOString().split('T')[0] : ''} 
                                onChange={e => setEditingEmployee(p => ({...p!, lastVacationDate: new Date(e.target.value)}))}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary" className="flex-1">Salvar na Equipe</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default HRManagement;
