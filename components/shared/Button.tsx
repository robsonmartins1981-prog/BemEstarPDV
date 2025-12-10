import React from 'react';

// Interface para as propriedades do componente Button.
// Permite uma tipagem forte e clara das props que o botão pode receber.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // O conteúdo do botão (texto, ícone, etc.).
  variant?: 'primary' | 'secondary' | 'danger' | 'success'; // Estilos pré-definidos do botão.
  // Fix: Add size prop to allow for different button sizes and resolve typing errors.
  size?: 'sm' | 'md' | 'lg';
  className?: string; // Permite adicionar classes CSS customizadas.
}

// Componente de botão reutilizável.
// Centralizar o estilo e comportamento dos botões aqui garante consistência visual
// em toda a aplicação e facilita a manutenção.
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  // Mapeamento das variantes para classes do Tailwind CSS.
  // Isso torna fácil adicionar novos estilos ou alterar os existentes.
  // Fix: Removed padding from baseClasses to be handled by sizeClasses.
  const baseClasses = "rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variantClasses = {
    primary: 'bg-theme-primary text-white hover:bg-theme-primary-hover focus:ring-theme-primary',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-theme-green text-white hover:bg-theme-green-hover focus:ring-theme-green',
  };

  // Fix: Added sizeClasses to handle different button sizes.
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  // Combina as classes base, as classes da variante e quaisquer classes customizadas passadas via props.
  // Fix: Added sizeClasses to the combination.
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
