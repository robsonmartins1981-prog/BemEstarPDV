
import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { Save, ArrowLeft, Shield, Check } from 'lucide-react';
import { db } from '../../services/databaseService';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserRole } from '../../types';

interface UserFormPageProps {
  userId?: string;
  onBack: () => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'pos', label: 'PDV (Vendas)' },
  { id: 'erp', label: 'ERP (Gestão Completa)' },
  { id: 'erp:dashboard', label: 'ERP: Análise e BI' },
  { id: 'erp:operacional', label: 'ERP: Operação de Caixa' },
  { id: 'erp:seguranca', label: 'ERP: Sistemas e Acessos' },
  { id: 'erp:estoque', label: 'ERP: Estoque' },
  { id: 'erp:compras', label: 'ERP: Compras' },
  { id: 'erp:clientes', label: 'ERP: Clientes' },
  { id: 'erp:fornecedores', label: 'ERP: Fornecedores' },
  { id: 'erp:configuracoes', label: 'ERP: Logística' },
  { id: 'fiscal', label: 'Fiscal' },
];

const UserFormPage: React.FC<UserFormPageProps> = ({ userId, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    role: 'OPERATOR',
    permissions: ['pos'],
    active: true
  });

  useEffect(() => {
    if (userId) {
      db.get('users', userId).then(user => {
        if (user) setFormData(user);
      });
    }
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || (!userId && !formData.password)) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      let finalPassword = formData.password || '';
      
      if (userId && !formData.password) {
        // Se estiver editando e a senha estiver vazia, buscar a senha atual
        const existingUser = await db.get('users', userId);
        if (existingUser) {
          finalPassword = existingUser.password;
        }
      }

      const userToSave: User = {
        id: userId || uuidv4(),
        username: formData.username!,
        password: finalPassword,
        role: formData.role as UserRole,
        permissions: formData.permissions || [],
        active: formData.active ?? true
      };

      await db.put('users', userToSave);
      onBack();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Erro ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes(permId)) {
        return { ...prev, permissions: current.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...current, permId] };
      }
    });
  };

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">
          {userId ? 'Editar Usuário' : 'Novo Usuário'}
        </h1>
      </div>
      
      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Shield size={14} className="text-theme-primary" /> Dados de Acesso
            </h3>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome de Usuário</label>
              <input 
                type="text" 
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary transition-all" 
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">
                {userId ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
              </label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary transition-all" 
                required={!userId}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Cargo / Nível</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary transition-all"
                >
                  <option value="OPERATOR">Operador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div 
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`w-10 h-6 rounded-full transition-all relative ${formData.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.active ? 'left-5' : 'left-1'}`}></div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200">Ativo</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Shield size={14} className="text-theme-primary" /> Permissões de Acesso
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {AVAILABLE_PERMISSIONS.map(perm => {
                const isSelected = formData.permissions?.includes(perm.id);
                return (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isSelected ? 'bg-theme-primary/5 border-theme-primary text-theme-primary shadow-sm' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    <span className="text-xs font-bold uppercase tracking-tight">{perm.label}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-theme-primary border-theme-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 italic">
              * Administradores têm acesso total por padrão, mas você pode definir permissões específicas para operadores.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={onBack} type="button">Cancelar</Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            <Save size={18} className="mr-2" /> Salvar Usuário
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFormPage;
