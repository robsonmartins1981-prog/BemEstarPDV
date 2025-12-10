
import React, { useState } from 'react';
import { ShoppingCart, Settings, Megaphone, Palette, Landmark } from 'lucide-react';
import ThemeModal from './ThemeModal';
import LogoIcon from './LogoIcon';

interface SidebarProps {
  currentView: 'pos' | 'erp' | 'crm' | 'fiscal';
  setView: (view: 'pos' | 'erp' | 'crm' | 'fiscal') => void;
}

const navItems = [
  { id: 'pos', label: 'PDV', icon: ShoppingCart },
  { id: 'erp', label: 'ERP', icon: Settings },
  { id: 'crm', label: 'CRM', icon: Megaphone },
  { id: 'fiscal', label: 'Fiscal', icon: Landmark },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);

  return (
    <>
      {/* 
          Configuração Responsiva:
          Mobile: w-full, h-16, fixed bottom-0, flex-row (Bottom Navigation)
          Desktop (md): w-20, h-full, relative, flex-col (Sidebar)
      */}
      <aside className="
        bg-white dark:bg-gray-800 shadow-md 
        z-50 border-t border-gray-200 dark:border-gray-700 md:border-t-0
        fixed bottom-0 w-full h-16 flex flex-row justify-around items-center px-2
        md:relative md:w-20 md:h-full md:flex-col md:py-4 md:justify-start
      ">
        {/* Logo - Escondido no mobile para economizar espaço */}
        <div className="hidden md:block mb-6">
          <LogoIcon className="w-12 h-12" />
        </div>

        <nav className="flex flex-row md:flex-col items-center justify-around w-full md:w-auto md:space-y-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as 'pos' | 'erp' | 'crm' | 'fiscal')}
              title={item.label}
              className={`
                flex flex-col items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none 
                p-1 md:p-2 md:w-16 md:h-16
                ${
                  currentView === item.id
                    ? 'text-theme-primary md:bg-theme-primary md:text-white shadow-sm md:shadow'
                    : 'text-gray-500 hover:text-theme-primary md:hover:bg-gray-100 dark:text-gray-400 dark:md:hover:bg-gray-700 dark:hover:text-white'
                }
              `}
            >
              <item.icon className={`mb-1 ${currentView === item.id ? 'w-6 h-6' : 'w-5 h-5'}`} />
              <span className="text-[10px] md:text-xs font-medium">{item.label}</span>
            </button>
          ))}
          
           {/* Botão de Tema no Mobile (integrado na nav) */}
           <button
              onClick={() => setThemeModalOpen(true)}
              title="Tema"
              className="flex md:hidden flex-col items-center justify-center rounded-lg transition-colors duration-200 text-gray-500 hover:text-theme-primary dark:text-gray-400 focus:outline-none p-1"
            >
              <Palette className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Tema</span>
            </button>
        </nav>

        {/* Botão de Tema no Desktop (final da sidebar) */}
        <div className="hidden md:block mt-auto">
             <button
              onClick={() => setThemeModalOpen(true)}
              title="Alterar Tema"
              className="w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-colors duration-200 text-gray-500 hover:bg-gray-100 hover:text-theme-primary dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white focus:outline-none"
            >
              <Palette className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Tema</span>
            </button>
        </div>
      </aside>
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setThemeModalOpen(false)} />
    </>
  );
};

export default Sidebar;
