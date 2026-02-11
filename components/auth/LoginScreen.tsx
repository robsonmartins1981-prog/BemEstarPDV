
import React, { useState } from 'react';
import { db } from '../../services/databaseService';
import { useAuth } from '../../App';
import Button from '../shared/Button';
import LogoIcon from '../shared/LogoIcon';
import { User, Lock, AlertCircle, Loader2 } from 'lucide-react';

const LoginScreen: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const users = await db.getAll('users');
            const found = users.find(u => 
                u.username.toLowerCase() === username.toLowerCase() && 
                u.password === password
            );

            if (found) {
                if (!found.active) {
                    setError('Este usuário está desativado.');
                } else {
                    login(found);
                }
            } else {
                setError('Usuário ou senha incorretos.');
            }
        } catch (err) {
            setError('Falha ao acessar o banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
                <div className="p-8 text-center bg-theme-primary/5 dark:bg-theme-primary/10 border-b dark:border-gray-700">
                    <LogoIcon className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Bem Estar</h1>
                    <p className="text-[10px] font-black text-theme-primary uppercase tracking-[0.3em] mt-1">Gestão Inteligente</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome de Usuário</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-primary transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-theme-primary outline-none transition-all font-bold"
                                    placeholder="Ex: admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-primary transition-colors" size={20} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:border-theme-primary outline-none transition-all font-bold"
                                    placeholder="••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl animate-bounce">
                                <AlertCircle size={20} className="shrink-0" />
                                <span className="text-xs font-black uppercase">{error}</span>
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            variant="primary" 
                            className="w-full py-5 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-theme-primary/20"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Sistema'}
                        </Button>
                    </form>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 text-center border-t dark:border-gray-700">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Bem Estar Gestão & PDV v2.5.0 PRO
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
