import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import Modal from './Modal';
import { useTheme } from '../../App';

const ThemeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { theme, setTheme } = useTheme();

    const themes = [
        { name: 'light', label: 'Claro', icon: Sun },
        { name: 'dark', label: 'Escuro', icon: Moon },
        { name: 'system', label: 'Sistema', icon: Laptop },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Selecionar Tema">
            <div className="flex justify-around gap-4 p-4">
                {themes.map((t) => (
                    <button
                        key={t.name}
                        onClick={() => setTheme(t.name as 'light' | 'dark' | 'system')}
                        className={`flex flex-col items-center justify-center p-4 w-28 h-28 rounded-lg border-2 transition-colors duration-200
                            ${theme === t.name ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <t.icon size={24} className="mb-2" />
                        <span className="font-semibold">{t.label}</span>
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default ThemeModal;
