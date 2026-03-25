
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { db, searchByIndex } from '../services/databaseService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const savedUserId = localStorage.getItem('bemestar_user_id');
      if (savedUserId) {
        try {
          const userData = await db.get('users', savedUserId);
          if (userData) {
            setUser(userData);
          }
        } catch (error) {
          console.error("Erro ao carregar usuário salvo:", error);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const users = await searchByIndex('users', 'username', username);
      const foundUser = users.find(u => u.password === password);
      
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('bemestar_user_id', foundUser.id);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Erro no login local:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bemestar_user_id');
  };

  const updateUser = async (data: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    try {
      const updatedUser = { ...user, ...data };
      await db.put('users', updatedUser);
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar usuário local:", error);
      return false;
    }
  };

  const changePassword = async (newPassword: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const updatedUser = { ...user, password: newPassword };
      await db.put('users', updatedUser);
      setUser(updatedUser);
      return true;
    } catch (error: any) {
      console.error("Erro ao alterar senha local:", error);
      throw error;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Admin tem acesso total
    if (user.role === 'ADMIN' || user.permissions.includes('ALL')) return true;
    
    // Lógica baseada em Roles para os módulos principais
    if (user.role === 'GERENTE') {
      // Gerente acessa quase tudo, exceto Configurações do Sistema (CONFIG)
      if (['PDV', 'ERP', 'CRM', 'ESTOQUE'].includes(permission)) return true;
    }
    
    if (user.role === 'USER_CAIXA') {
      // Caixa acessa apenas PDV
      if (['PDV'].includes(permission)) return true;
    }
    
    // Verifica se a permissão está na lista do usuário (para permissões granulares)
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser, changePassword, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
