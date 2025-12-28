
import React, { useState } from 'react';
import Button from '../shared/Button';
import { Sun, Sunset, Moon, DollarSign as DollarIcon } from 'lucide-react';

interface OpenCashScreenProps {
  onOpen: (initialAmount: number, shiftName: string) => void; 
}

const OpenCashScreen: React.FC<OpenCashScreenProps> = ({ onOpen }) => {
  const [amount, setAmount] = useState('0,00');
  const [selectedShift, setSelectedShift] = useState<'Caixa 01 (Manhã)' | 'Caixa 02 (Tarde)' | 'Caixa 03 (Noite)'>('Caixa 01 (Manhã)');
  const [error, setError] = useState('');

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const numberValue = parseInt(digits || '0', 10) / 100;
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 
    const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));

    if (isNaN(numericAmount) || numericAmount < 0) {
      setError('Por favor, insira um valor de suprimento válido.');
      return;
    }

    setError(''); 
    onOpen(numericAmount, selectedShift); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-full mb-4">
              <DollarIcon className="w-12 h-12 text-theme-primary" />
          </div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Bem Estar</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Gestão Comercial & PDV</p>
        </div>

        <h2 className="text-sm font-black text-center mb-6 text-gray-400 uppercase tracking-[0.2em]">Configuração de Abertura</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase ml-1">Selecione o Turno</label>
              <div className="grid grid-cols-3 gap-3">
                  <button
                      type="button"
                      onClick={() => setSelectedShift('Caixa 01 (Manhã)')}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all ${selectedShift === 'Caixa 01 (Manhã)' ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200'}`}
                  >
                      <Sun size={24} className="mb-2" />
                      <span className="text-[10px] font-black uppercase">Manhã</span>
                  </button>
                  <button
                      type="button"
                      onClick={() => setSelectedShift('Caixa 02 (Tarde)')}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all ${selectedShift === 'Caixa 02 (Tarde)' ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200'}`}
                  >
                      <Sunset size={24} className="mb-2" />
                      <span className="text-[10px] font-black uppercase">Tarde</span>
                  </button>
                  <button
                      type="button"
                      onClick={() => setSelectedShift('Caixa 03 (Noite)')}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all ${selectedShift === 'Caixa 03 (Noite)' ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200'}`}
                  >
                      <Moon size={24} className="mb-2" />
                      <span className="text-[10px] font-black uppercase">Noite</span>
                  </button>
              </div>
          </div>

          <div>
            <label htmlFor="initialAmount" className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Suprimento de Troco</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-5 flex items-center text-gray-400 font-bold text-xl">R$</span>
              <input
                id="initialAmount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={handleAmountChange}
                className="w-full pl-16 pr-6 py-5 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-0 focus:border-theme-primary bg-gray-50 dark:bg-gray-900 text-4xl text-right font-mono font-black transition-all"
                autoFocus 
              />
            </div>
            {error && <p className="mt-2 text-xs text-red-600 font-bold text-center uppercase tracking-wide">{error}</p>}
          </div>

          <Button type="submit" className="w-full text-lg py-5 rounded-2xl font-black uppercase tracking-widest" variant="primary">
            Iniciar {selectedShift}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OpenCashScreen;
