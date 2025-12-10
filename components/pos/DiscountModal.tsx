import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  onApply: (value: number) => void;
}

// Senha de gerente hardcoded para a funcionalidade de permissão.
const MANAGER_PASSWORD = '1234';

const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose, type, onApply }) => {
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Reseta o estado do modal ao fechar.
  const handleClose = () => {
    setValue('');
    setPassword('');
    setError('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
        handleClose();
    }
  }, [isOpen]);

  const handleApplyClick = () => {
    // 1. Validação de Permissão
    if (password !== MANAGER_PASSWORD) {
      setError('Senha de gerente inválida.');
      return;
    }
    
    // 2. Validação do Valor
    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      setError('Por favor, insira um valor de desconto válido e positivo.');
      return;
    }
    if (type === 'PERCENTAGE' && numericValue > 100) {
        setError('O desconto percentual não pode ser maior que 100%.');
        return;
    }

    // 3. Aplica o desconto
    onApply(numericValue);
    handleClose(); // Fecha o modal após sucesso
  };
  
  const title = `Aplicar Desconto ${type === 'PERCENTAGE' ? 'Percentual (%)' : 'Fixo (R$)'}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleApplyClick}>Aplicar Desconto</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="discount-value" className="block text-sm font-medium">
            Valor do Desconto {type === 'PERCENTAGE' ? '(%)' : '(R$)'}
          </label>
          <input
            id="discount-value"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 5,00'}
            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="manager-password" className="block text-sm font-medium">
            Senha do Gerente
          </label>
          <input
            id="manager-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
};

export default DiscountModal;
