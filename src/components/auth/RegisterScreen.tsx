
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../shared/Button';
import { Lock, User, Mail, Phone, MapPin, CreditCard, ArrowLeft } from 'lucide-react';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onSuccess }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    cpf: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const trimmedData = {
        ...formData,
        email: formData.email.trim()
      };
      const success = await register(trimmedData);
      if (success) {
        onSuccess();
      } else {
        setError('Erro ao realizar cadastro. Verifique os dados e tente novamente.');
      }
    } catch (err: any) {
      console.error("Register Error Details:", err);
      if (err.message?.includes('auth/invalid-email')) {
        setError('E-mail em formato inválido');
      } else if (err.message?.includes('auth/email-already-in-use')) {
        setError('Este e-mail já está em uso');
      } else if (err.message?.includes('auth/weak-password')) {
        setError('A senha deve ter pelo menos 6 caracteres');
      } else {
        setError('Erro ao realizar cadastro');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8">
        <div className="flex flex-col items-center mb-8">
          <button 
            onClick={onBack}
            className="self-start p-2 text-gray-400 hover:text-theme-primary transition-colors mb-4"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white text-center">Criar Conta</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Bem Estar Produtos Naturais</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">CPF</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Endereço Completo</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-theme-primary transition-all"
                  placeholder="Rua, número, bairro, cidade"
                  required
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            className="w-full py-4 rounded-2xl shadow-lg shadow-theme-primary/30 mt-4"
            isLoading={isLoading}
          >
            Cadastrar Agora
          </Button>

          <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">
            Já tem uma conta?{' '}
            <button 
              type="button" 
              onClick={onBack}
              className="text-theme-primary hover:underline"
            >
              Fazer Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterScreen;
