
import React, { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import type { CashOperation } from '../../types';

interface CashOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (operation: Partial<CashOperation>) => void;
}

const CashOperationsModal: React.FC<CashOperationsModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [operationType, setOperationType] = useState<'SANGRIA' | 'REFORCO'>('SANGRIA');
  const [amount, setAmount] = useState('0,00');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const numberValue = parseInt(digits || '0', 10) / 100;
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatCurrencyInput(e.target.value));
  };

  const handleConfirm = () => {
    const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Valor inválido. Insira um número positivo.');
      return;
    }
    if (description.trim() === '') {
      setError('A descrição é obrigatória.');
      return;
    }
    
    const operation: Partial<CashOperation> = {
      type: operationType,
      amount: numericAmount,
      date: new Date().toISOString(),
      description,
    };
    
    onConfirm(operation);
    handleClose();
  };

  const handleClose = () => {
    setAmount('0,00');
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
        <div className="flex gap-2 rounded-xl bg-gray-100 dark:bg-gray-900 p-1">
          <button
            onClick={() => setOperationType('SANGRIA')}
            className={`w-full py-3 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${operationType === 'SANGRIA' ? 'bg-red-500 text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Sangria
          </button>
          <button
            onClick={() => setOperationType('REFORCO')}
            className={`w-full py-3 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${operationType === 'REFORCO' ? 'bg-theme-primary text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Reforço
          </button>
        </div>
        
        <div>
          <label htmlFor="op-amount" className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Valor da Operação</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 font-bold">R$</span>
            <input
              id="op-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={handleAmountChange}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl focus:ring-0 focus:border-theme-primary bg-gray-50 dark:bg-gray-900 text-3xl text-right font-mono font-black"
            />
          </div>
        </div>

        <div>
          <label htmlFor="op-description" className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Descrição / Motivo</label>
          <input
            id="op-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Pagamento de frete, Sangria de segurança..."
            className="w-full mt-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none bg-gray-50 dark:bg-gray-800"
          />
        </div>
        
        {error && <p className="text-xs text-red-600 font-bold text-center">{error}</p>}
      </div>
    </Modal>
  );
};

export default CashOperationsModal;
