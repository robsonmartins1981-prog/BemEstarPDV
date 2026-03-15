
import React from 'react';
import { BarChart, Boxes, AlertTriangle } from 'lucide-react';

const InventoryReport: React.FC = () => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-theme-primary/10 p-3 rounded-2xl">
          <BarChart className="w-8 h-8 text-theme-primary" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Inventário e Validade</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
          <Boxes className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">Valor Total do Estoque</h3>
          <p className="text-2xl font-black text-theme-primary">R$ 0,00</p>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">Produtos Vencendo</h3>
          <p className="text-2xl font-black text-red-500">0</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
