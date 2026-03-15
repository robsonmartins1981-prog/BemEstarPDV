
import React from 'react';
import { ShoppingBag, ArrowLeft, Printer } from 'lucide-react';
import Button from '../shared/Button';

interface GenerateOrderProps {
  onBack: () => void;
}

const GenerateOrder: React.FC<GenerateOrderProps> = ({ onBack }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Gerar Pedido de Compra</h1>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-theme-primary/10 p-6 rounded-3xl mb-6">
          <ShoppingBag className="w-16 h-16 text-theme-primary" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white mb-2">Pedido de Compra Inteligente</h2>
        <p className="text-gray-400 font-medium max-w-md mb-8">O sistema analisa seu estoque atual e gera automaticamente uma lista de sugestão de compra baseada no estoque mínimo.</p>
        
        <Button variant="primary" size="lg" className="px-12 py-6 rounded-2xl shadow-lg shadow-theme-primary/30">
          <Printer size={20} className="mr-2" /> Gerar Relatório de Compra
        </Button>
      </div>
    </div>
  );
};

export default GenerateOrder;
