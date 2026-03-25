
import React, { useState, useEffect } from 'react';
import { UserCog, UserPlus, Search, Edit2, Trash2, Shield, User as UserIcon } from 'lucide-react';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { User } from '../../types';

interface UserManagementProps {
  onNewUser: () => void;
  onEditUser: (id: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onNewUser, onEditUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await db.getAll('users');
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      try {
        await db.delete('users', id);
        setDeleteConfirmId(null);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:border-theme-primary"
          />
        </div>
        <Button onClick={onNewUser}>
          <UserPlus size={20} className="mr-2" /> Novo Usuário
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-primary"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargo</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Permissões</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <UserIcon size={16} className="text-gray-500" />
                      </div>
                      <span className="font-bold text-gray-800 dark:text-white">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[9px] font-bold text-gray-500 uppercase">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-bold text-gray-500 uppercase">{user.active ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEditUser(user.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-theme-primary transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)} 
                        className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
                          deleteConfirmId === user.id 
                            ? 'bg-red-500 text-white hover:bg-red-600 px-3' 
                            : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500'
                        }`}
                        disabled={user.username === 'admin' || user.username === 'robsonmartins1981@gmail.com'}
                        title={deleteConfirmId === user.id ? 'Clique novamente para confirmar' : 'Excluir usuário'}
                      >
                        <Trash2 size={16} />
                        {deleteConfirmId === user.id && <span className="text-[10px] font-black uppercase">Confirmar?</span>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-12 text-center">
          <UserCog size={64} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-bold uppercase text-sm">Nenhum usuário encontrado</p>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
