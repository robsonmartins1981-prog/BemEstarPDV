
import React from 'react';
import { Receipt, FileText, Settings, ShieldCheck } from 'lucide-react';

const FiscalScreen: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-theme-primary/10 p-3 rounded-2xl">
          <Receipt className="w-8 h-8 text-theme-primary" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Módulo Fiscal</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <h3 className="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-widest">Configuração de Emitente</h3>
          </div>
          <p className="text-xs text-gray-400 font-medium mb-4">Gerencie os dados da sua empresa para emissão de notas fiscais.</p>
          <button className="w-full py-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-theme-primary hover:text-white transition-all">Configurar</button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-blue-500" />
            <h3 className="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-widest">Notas Emitidas</h3>
          </div>
          <p className="text-xs text-gray-400 font-medium mb-4">Consulte e gerencie todas as NFC-e e NF-e emitidas pelo sistema.</p>
          <button className="w-full py-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-theme-primary hover:text-white transition-all">Ver Notas</button>
        </div>
      </div>
    </div>
  );
};

export default FiscalScreen;
