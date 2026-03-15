
import React from 'react';
import { ArrowLeft, ReceiptText } from 'lucide-react';

interface TodaySalesScreenProps {
  onBack: () => void;
}

const TodaySalesScreen: React.FC<TodaySalesScreenProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tight">Vendas de Hoje</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
        <ReceiptText size={64} className="mb-4 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-sm">Nenhuma venda registrada hoje</p>
      </div>
    </div>
  );
};

export default TodaySalesScreen;
