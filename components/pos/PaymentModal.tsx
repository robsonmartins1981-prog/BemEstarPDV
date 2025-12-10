import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { PaymentMethod } from '../../types';
import type { Payment } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onFinalize: (payments: Payment[], change: number) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Componente de modal para processamento de pagamentos.
// Lida com múltiplos métodos de pagamento, pagamentos parciais e cálculo de troco.
const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onFinalize }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [currentAmount, setCurrentAmount] = useState('');

  // Calcula o total já pago e o valor restante.
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const remainingAmount = totalAmount - totalPaid;

  // Reseta o estado do modal sempre que ele é aberto.
  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setCurrentAmount('');
      setCurrentMethod(PaymentMethod.DINHEIRO);
    }
  }, [isOpen]);

  // Adiciona um pagamento à lista de pagamentos (para entrada manual).
  const handleAddPayment = () => {
    let amountToAdd = parseFloat(currentAmount.replace(',', '.'));

    // Se o valor estiver vazio, usa o valor restante.
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      amountToAdd = remainingAmount;
    }
    
    if (amountToAdd > 0) {
      setPayments([...payments, { method: currentMethod, amount: amountToAdd }]);
      setCurrentAmount('');
    }
  };

  // Adiciona um pagamento rápido em dinheiro a partir dos botões de sugestão.
  const handleQuickCashPayment = (amount: number) => {
    setPayments([...payments, { method: PaymentMethod.DINHEIRO, amount: amount }]);
    setCurrentAmount(''); // Limpa a entrada manual para evitar confusão.
  };

  const handleFinalize = () => {
    const cashPaid = payments
      .filter(p => p.method === PaymentMethod.DINHEIRO)
      .reduce((sum, p) => sum + p.amount, 0);

    const nonCashPaid = totalPaid - cashPaid;
    
    // O troco só é calculado sobre o valor que falta pagar depois dos outros métodos.
    const remainingForCash = totalAmount - nonCashPaid;
    const change = Math.max(0, cashPaid - remainingForCash);
    
    onFinalize(payments, change);
  };
  
  const paymentComplete = remainingAmount <= 0;
  const isFinalizeDisabled = !paymentComplete;

  // Lógica para sugerir valores de notas de dinheiro
  const suggestedAmounts = useMemo(() => {
    if (remainingAmount <= 0) return [];
    
    const suggestions = new Set<number>();
    const bills = [5, 10, 20, 50, 100, 200];
    
    // Adiciona o valor exato
    suggestions.add(parseFloat(remainingAmount.toFixed(2)));

    // Adiciona a próxima nota maior
    const nextBill = bills.find(bill => bill > remainingAmount);
    if (nextBill) {
      suggestions.add(nextBill);
    }
    
    // Adiciona a próxima nota arredondada para cima (ex: 83 -> 90, 100)
    const roundedUp10 = Math.ceil(remainingAmount / 10) * 10;
    if (roundedUp10 > remainingAmount) {
        suggestions.add(roundedUp10);
    }

    // Garante que sempre haja opções maiores
    if (remainingAmount < 50) suggestions.add(50);
    if (remainingAmount < 100) suggestions.add(100);

    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 5);

  }, [remainingAmount]);


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagamento"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="success" onClick={handleFinalize} disabled={isFinalizeDisabled}>
            Finalizar Venda
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Resumo dos valores */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Total a Pagar</p>
            <p className="text-2xl font-bold text-theme-primary">{formatCurrency(totalAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Pago</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{remainingAmount > 0 ? 'Restante' : 'Troco'}</p>
            <p className={`text-2xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-blue-500'}`}>
              {formatCurrency(Math.abs(remainingAmount))}
            </p>
          </div>
        </div>

        {/* Lista de pagamentos adicionados */}
        {payments.length > 0 && (
          <div className="space-y-2">
             <h3 className="text-sm font-semibold">Pagamentos Realizados:</h3>
            {payments.map((p, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                <span>{p.method}</span>
                <span className="font-semibold">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Formulário para adicionar novo pagamento (se não estiver completo) */}
        {!paymentComplete && (
            <div className="p-4 border rounded-lg dark:border-gray-600 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {Object.values(PaymentMethod).map(method => (
                  <button
                    key={method}
                    onClick={() => setCurrentMethod(method)}
                    className={`p-2 rounded-md text-sm font-semibold transition-colors ${currentMethod === method ? 'bg-theme-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {/* Sugestões de notas para pagamento em Dinheiro */}
              {currentMethod === PaymentMethod.DINHEIRO && (
                <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-gray-500">Valor entregue (sugestões):</p>
                    <div className="flex gap-2 flex-wrap">
                        {suggestedAmounts.map(amount => (
                            <Button
                                key={amount}
                                variant="secondary"
                                className="!px-3 !py-1 text-sm"
                                onClick={() => handleQuickCashPayment(amount)}
                            >
                                {formatCurrency(amount)}
                            </Button>
                        ))}
                    </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder={`Valor para ${currentMethod}...`}
                  className="flex-grow w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <Button onClick={handleAddPayment}>Adicionar</Button>
              </div>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;