import React, { useState } from 'react';
import Button from '../shared/Button';

// Interface para as propriedades do componente OpenCashScreen.
interface OpenCashScreenProps {
  onOpen: (initialAmount: number) => void; // Função callback chamada ao abrir o caixa.
}

// Componente que representa a tela de Abertura de Caixa.
// É a primeira tela que o operador vê se não houver um caixa aberto.
const OpenCashScreen: React.FC<OpenCashScreenProps> = ({ onOpen }) => {
  // Estado para armazenar o valor inicial de troco digitado pelo operador.
  const [amount, setAmount] = useState('');
  // Estado para mensagens de erro, como valor inválido.
  const [error, setError] = useState('');

  // Lida com a submissão do formulário.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Previne o recarregamento da página.
    
    // Converte o valor para um número.
    // Substitui vírgula por ponto para aceitar ambos os formatos.
    const numericAmount = parseFloat(amount.replace(',', '.'));

    // Validação: verifica se o valor é um número válido e não é negativo.
    if (isNaN(numericAmount) || numericAmount < 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    setError(''); // Limpa qualquer erro anterior.
    onOpen(numericAmount); // Chama a função onOpen passada por props com o valor validado.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo da loja */}
          <div className="inline-block p-4 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-full mb-4">
              <svg className="w-16 h-16 text-theme-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 18a6 6 0 0 0 6-6h-6V6a6 6 0 1 0 0 12Z" fill="currentColor" opacity="0.4"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.96.567 3.782 1.585 5.293C4.128 16.53 5 15.635 5 15.635V12a7 7 0 0 1 7-7h4.635S17.47 4.128 16.293 3.585A9.94 9.94 0 0 0 12 2Z" fill="currentColor"/>
              </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">UseNatural PDV</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">A Casa do seu Bem Estar</p>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700 dark:text-gray-200">Abrir Caixa</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="initialAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor Inicial (Suprimento)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">R$</span>
              <input
                id="initialAmount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-theme-primary focus:border-theme-primary bg-gray-50 dark:bg-gray-700 text-lg text-right"
                autoFocus // Foca neste campo automaticamente ao carregar a tela.
              />
            </div>
            {/* Exibe a mensagem de erro, se houver. */}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <Button type="submit" className="w-full text-lg" variant="primary">
            Iniciar Turno
          </Button>
        </form>
      </div>
    </div>
  );
};

export default OpenCashScreen;