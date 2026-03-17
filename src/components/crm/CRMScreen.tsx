
import React, { useState } from 'react';
import { Users, Target, MessageSquare, Gift, Tag, History } from 'lucide-react';
import CustomerManagement from './CustomerManagement';
import PromotionsScreen from './PromotionsScreen';

const CRMScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'promotions' | 'loyalty'>('customers');

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-theme-primary/10 p-3 rounded-2xl">
            <Users className="w-8 h-8 text-theme-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Relacionamento (CRM)</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestão de Clientes, Promoções e Fidelidade</p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'customers' ? 'bg-white dark:bg-gray-700 text-theme-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Users size={14} /> Clientes & Segmentação
            </div>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'promotions' ? 'bg-white dark:bg-gray-700 text-theme-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Tag size={14} /> Campanhas Promocionais
            </div>
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'loyalty' ? 'bg-white dark:bg-gray-700 text-theme-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <div className="flex items-center gap-2">
              <Gift size={14} /> Fidelidade
            </div>
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'promotions' && <PromotionsScreen />}
        {activeTab === 'loyalty' && (
          <div className="bg-white dark:bg-gray-800 rounded-[40px] p-20 text-center border dark:border-gray-700 shadow-sm">
            <Gift size={64} className="mx-auto text-gray-200 dark:text-gray-700 mb-6" />
            <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight mb-2">Módulo de Fidelidade</h3>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-8 max-w-md mx-auto">
              O histórico de compras e o ticket médio já estão disponíveis no Painel Fidelidade dentro da Gestão de Clientes.
            </p>
            <button 
              onClick={() => setActiveTab('customers')}
              className="px-6 py-3 bg-theme-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-theme-primary/90 transition-all"
            >
              Ver Clientes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRMScreen;
