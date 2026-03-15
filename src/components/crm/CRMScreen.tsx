
import React from 'react';
import { Users, Target, MessageSquare, Gift } from 'lucide-react';

const CRMScreen: React.FC = () => {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-theme-primary/10 p-3 rounded-2xl">
          <Users className="w-8 h-8 text-theme-primary" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Gestão de Clientes (CRM)</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
          <Target className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">Segmentação</h3>
          <p className="text-xs text-gray-400 font-medium">Crie grupos de clientes baseados em comportamento de compra.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
          <MessageSquare className="w-10 h-10 text-emerald-500 mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">Campanhas</h3>
          <p className="text-xs text-gray-400 font-medium">Envie mensagens automáticas via WhatsApp ou E-mail.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
          <Gift className="w-10 h-10 text-amber-500 mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-white mb-2">Fidelidade</h3>
          <p className="text-xs text-gray-400 font-medium">Gerencie pontos e cupons de desconto para clientes VIP.</p>
        </div>
      </div>
    </div>
  );
};

export default CRMScreen;
