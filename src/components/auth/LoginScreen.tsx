
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../shared/Button';
import { Lock, User, ShieldCheck } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (!success) {
        setError('Usuário ou senha inválidos');
      }
    } catch (err) {
      setError('Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-theme-primary/10 p-4 rounded-2xl mb-4">
            <ShieldCheck className="w-10 h-10 text-theme-primary" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Bem-Estar PDV</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Acesso ao Sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                placeholder="Digite seu usuário"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-4 rounded-2xl shadow-lg shadow-theme-primary/30"
            isLoading={isLoading}
          >
            Entrar no Sistema
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Versão Desktop 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
