
import React, { useState } from 'react';
import { ShoppingCart, Settings, Megaphone, Palette, Landmark, LogOut, Wallet } from 'lucide-react';
import ThemeModal from './ThemeModal';
import LogoIcon from './LogoIcon';
import { useAuth } from '../../App';

interface SidebarProps {
  currentView: 'pos' | 'erp' | 'crm' | 'fiscal' | 'finance';
  setView: (view: 'pos' | 'erp' | 'crm' | 'fiscal' | 'finance') => void;
}

const navItems = [
  { id: 'pos', label: 'PDV', icon: ShoppingCart },
  { id: 'erp', label: 'ERP', icon: Settings },
  { id: 'crm', label: 'CRM', icon: Megaphone },
  { id: 'fiscal', label: 'Fiscal', icon: Landmark },
  { id: 'finance', label: 'Finanças', icon: Wallet },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const [isThemeModalOpen, setThemeModalOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  const filteredItems = navItems.filter(item => {
    if (item.id === 'finance') return true;
    const hasPermission = user?.permissions.includes(item.id as any) || user?.permissions.some(p => p.startsWith(`${item.id}:`));
    return hasPermission;
  });

  return (
    <>
      <aside className="
        bg-white dark:bg-gray-800 shadow-md 
        z-50 border-t border-gray-200 dark:border-gray-700 md:border-t-0
        fixed bottom-0 w-full h-16 flex flex-row justify-around items-center px-2
        md:relative md:w-20 md:h-full md:flex-col md:py-4 md:justify-start
      ">
        <div className="hidden md:block mb-6">
          <LogoIcon className="w-12 h-12" />
        </div>

        <nav className="flex flex-row md:flex-col items-center justify-around w-full md:w-auto md:space-y-4">
          {filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as 'pos' | 'erp' | 'crm' | 'fiscal' | 'finance')}
              className={`
                flex flex-col items-center justify-center rounded-lg transition-all duration-200 
                p-1 md:p-2 md:w-16 md:h-16
                ${
                  currentView === item.id
                    ? 'text-theme-primary md:bg-theme-primary md:text-white shadow-sm'
                    : 'text-gray-500 hover:text-theme-primary dark:text-gray-400'
                }
              `}
            >
              <item.icon className={`mb-1 ${currentView === item.id ? 'w-6 h-6' : 'w-5 h-5'}`} />
              <span className="text-[10px] md:text-xs font-bold uppercase">{item.label}</span>
            </button>
          ))}
          
          {/* MOBILE ONLY: SAIR */}
          <button
              onClick={handleLogoutClick}
              className="flex md:hidden flex-col items-center justify-center rounded-lg text-red-500 p-1"
            >
              <LogOut className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">Sair</span>
          </button>
        </nav>

        <div className="hidden md:flex mt-auto flex-col gap-2">
             <button
              onClick={() => setThemeModalOpen(true)}
              title="Tema"
              className="w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-colors text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Palette className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase">Tema</span>
            </button>

            <button
              onClick={handleLogoutClick}
              title="Encerrar Sessão"
              className="w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase">Sair</span>
            </button>
        </div>
      </aside>
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setThemeModalOpen(false)} />
    </>
  );
};

export default Sidebar;
