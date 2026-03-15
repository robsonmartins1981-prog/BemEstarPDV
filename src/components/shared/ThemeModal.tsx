
import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { useTheme } from '../../App';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  const options = [
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'dark', label: 'Escuro', icon: Moon },
    { id: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações de Tema" size="sm">
      <div className="space-y-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setTheme(option.id as any)}
            className={`
              w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 
              ${
                theme === option.id
                  ? 'bg-theme-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <option.icon size={20} />
              <span className="font-bold uppercase text-sm tracking-tight">{option.label}</span>
            </div>
            {theme === option.id && <Check size={18} />}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Button variant="primary" className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </Modal>
  );
};

export default ThemeModal;
