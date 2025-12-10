
import React from 'react';

// Interface para as propriedades do componente Modal.
interface ModalProps {
  isOpen: boolean; // Controla se o modal está visível ou não.
  onClose: () => void; // Função a ser chamada quando o modal deve ser fechado.
  title: string; // Título exibido no cabeçalho do modal.
  children: React.ReactNode; // Conteúdo principal do modal.
  footer?: React.ReactNode; // Conteúdo opcional para o rodapé (ex: botões de ação).
}

// Componente de modal genérico e reutilizável.
// Ele fornece a estrutura básica de um modal (fundo escurecido, container, cabeçalho),
// permitindo que qualquer conteúdo seja inserido dentro dele.
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  // Se o modal não estiver aberto, não renderiza nada.
  if (!isOpen) return null;

  // Função para lidar com o clique no fundo escurecido (backdrop).
  // Chama a função onClose para fechar o modal.
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // O portal do modal, que cobre a tela inteira.
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={handleBackdropClick}
    >
      {/* O container principal do modal, com estilos para cor, sombra e bordas. */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Cabeçalho do modal */}
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Fechar modal"
          >
            {/* Ícone 'X' para fechar */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        {/* Corpo do modal, onde o conteúdo principal é renderizado. */}
        <main className="p-6 overflow-y-auto">
          {children}
        </main>

        {/* Rodapé do modal, renderizado apenas se a prop 'footer' for fornecida. */}
        {footer && (
          <footer className="flex justify-end items-center p-4 border-t border-gray-200 dark:border-gray-700 space-x-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default Modal;
   