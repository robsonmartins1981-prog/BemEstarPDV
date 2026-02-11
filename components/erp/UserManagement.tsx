
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { User } from '../../types';
import Button from '../shared/Button';
import { UserPlus, Edit, Trash2, Shield, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

interface UserManagementProps {
    onNewUser: () => void;
    onEditUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onNewUser, onEditUser }) => {
    const [users, setUsers] = useState<User[]>([]);

    const fetchUsers = useCallback(async () => {
        const all = await db.getAll('users');
        setUsers(all.sort((a,b) => a.username.localeCompare(b.username)));
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDelete = async (id: string) => {
        const userToDelete = users.find(u => u.id === id);
        if (userToDelete?.username === 'admin') {
            alert('O administrador mestre não pode ser excluído.');
            return;
        }

        if (confirm('Deseja realmente remover este usuário do sistema?')) {
            await db.delete('users', id);
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Usuários do Sistema</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Gestão de Autenticação e Níveis de Acesso</p>
                </div>
                <Button onClick={onNewUser}>
                    <UserPlus size={18}/> Novo Usuário
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {users.map(u => (
                    <div key={u.id} className={`bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border-2 transition-all ${u.active ? 'border-transparent' : 'border-gray-200 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl ${u.role === 'ADMIN' ? 'bg-red-50 text-red-500' : 'bg-theme-primary/10 text-theme-primary'}`}>
                                    {u.role === 'ADMIN' ? <ShieldAlert size={28} /> : <Shield size={28} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter leading-none">{u.username}</h3>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {u.role}
                                    </span>
                                </div>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {u.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Módulos Autorizados</p>
                                <div className="flex flex-wrap gap-2">
                                    {['pos', 'erp', 'crm', 'fiscal'].map(mod => {
                                        const isAllowed = u.permissions.includes(mod as any);
                                        return (
                                            <span key={mod} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-colors ${isAllowed ? 'bg-theme-primary/10 text-theme-primary' : 'bg-gray-50 text-gray-300'}`}>
                                                {isAllowed ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                                                {mod}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t dark:border-gray-700">
                                <Button variant="secondary" className="flex-1 !p-2" onClick={() => onEditUser(u.id)}>
                                    <Edit size={16} className="mr-2"/> Configurar Acesso
                                </Button>
                                {u.username !== 'admin' && (
                                    <Button variant="danger" className="!p-2" onClick={() => handleDelete(u.id)}>
                                        <Trash2 size={18}/>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;
