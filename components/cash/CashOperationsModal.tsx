import React, { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import type { CashTransaction } from '../../types';

interface CashOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transaction: CashTransaction) => void;
}

// Componente de modal para registrar operações de Sangria e Reforço.
// Ele é chamado a partir da tela principal do PDV.
const CashOperationsModal: React.FC<CashOperationsModalProps> = ({ isOpen, onClose, onConfirm }) => {
  // Estado para controlar qual tipo de operação está selecionada: Sangria ou Reforço.
  const [operationType, setOperationType] = useState<'SANGRIA' | 'REFORCO'>('SANGRIA');
  // Estado para o valor da operação.
  const [amount, setAmount] = useState('');
  // Estado para a descrição/motivo da operação.
  const [description, setDescription] = useState('');
  // Estado para mensagens de erro.
  const [error, setError] = useState('');

  // Lida com a confirmação da operação.
  const handleConfirm = () => {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    
    // Validação dos campos.
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Valor inválido. Insira um número positivo.');
      return;
    }
    if (description.trim() === '') {
      setError('A descrição é obrigatória.');
      return;
    }
    
    // Cria o objeto de transação.
    const transaction: CashTransaction = {
      type: operationType,
      amount: numericAmount,
      date: new Date(),
      description,
    };
    
    onConfirm(transaction); // Chama a função de callback com a transação.
    handleClose(); // Fecha e reseta o modal.
  };

  // Reseta o estado do modal ao fechar.
  const handleClose = () => {
    setAmount('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Movimentação de Caixa"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirmar</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Seleção do tipo de operação */}
        <div className="flex gap-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
          <button
            onClick={() => setOperationType('SANGRIA')}
            className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${operationType === 'SANGRIA' ? 'bg-red-500 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Sangria (Retirada)
          </button>
          <button
            onClick={() => setOperationType('REFORCO')}
            className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition-colors ${operationType === 'REFORCO' ? 'bg-green-500 text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}
          >
            Reforço (Adição)
          </button>
        </div>
        
        {/* Campo de Valor */}
        <div>
          <label htmlFor="op-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor</label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">R$</span>
            <input
              id="op-amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-primary focus:border-theme-primary bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Campo de Descrição */}
        <div>
          <label htmlFor="op-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição / Motivo</label>
          <input
            id="op-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-primary focus:border-theme-primary bg-gray-50 dark:bg-gray-700"
          />
        </div>
        
        {/* Exibição de Erro */}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
};

export default CashOperationsModal;