
import React from 'react';
import { Settings, Store, Smartphone, ShieldCheck } from 'lucide-react';
import Button from '../shared/Button';

const GeneralSettings: React.FC = () => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-theme-primary/10 p-3 rounded-2xl">
          <Settings className="w-8 h-8 text-theme-primary" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Configurações Gerais</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Store className="w-6 h-6 text-theme-primary" />
              <h3 className="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-widest">Dados da Loja</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome da Loja</label>
                <input type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary" defaultValue="Bem-Estar PDV" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="w-6 h-6 text-emerald-500" />
              <h3 className="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-widest">Comunicação</h3>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">WhatsApp para Delivery</label>
              <input type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary" placeholder="55..." />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-8 pt-8 border-t dark:border-gray-700">
        <Button variant="primary" className="px-12 py-4 rounded-2xl shadow-lg shadow-theme-primary/30">
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default GeneralSettings;
