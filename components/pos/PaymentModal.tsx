
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { PaymentMethod } from '../../types';
import type { Payment } from '../../types';
import { DollarSign, Smartphone, CreditCard, User, Check, ArrowRight, Wallet } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onFinalize: (payments: Payment[], change: number) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onFinalize }) => {
  const [methodValues, setMethodValues] = useState<Record<PaymentMethod, string>>({
    [PaymentMethod.DINHEIRO]: '0,00',
    [PaymentMethod.PIX]: '0,00',
    [PaymentMethod.DEBITO]: '0,00',
    [PaymentMethod.CREDITO]: '0,00',
    [PaymentMethod.NOTINHA]: '0,00',
  });

  useEffect(() => {
    if (isOpen) {
      setMethodValues({
        [PaymentMethod.DINHEIRO]: '0,00',
        [PaymentMethod.PIX]: '0,00',
        [PaymentMethod.DEBITO]: '0,00',
        [PaymentMethod.CREDITO]: '0,00',
        [PaymentMethod.NOTINHA]: '0,00',
      });
    }
  }, [isOpen]);

  const totalReceived = useMemo(() => {
    return Object.values(methodValues).reduce((sum: number, val: string) => {
      const num = parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
      return sum + num;
    }, 0);
  }, [methodValues]);

  // Usamos arredondamento para evitar erros de precisão decimal (ex: 0.000000001)
  const normalizedTotal = Math.round(totalAmount * 100) / 100;
  const normalizedReceived = Math.round(totalReceived * 100) / 100;

  const remaining = Math.max(0, normalizedTotal - normalizedReceived);
  const change = Math.max(0, normalizedReceived - normalizedTotal);
  const isPaid = normalizedReceived >= normalizedTotal - 0.001;

  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const numberValue = parseInt(digits || '0', 10) / 100;
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleValueChange = (method: PaymentMethod, value: string) => {
    const formatted = formatCurrencyInput(value);
    setMethodValues(prev => ({ ...prev, [method]: formatted }));
  };

  const handleFocus = (method: PaymentMethod) => {
    setMethodValues(prev => ({ ...prev, [method]: '' }));
  };

  const fillRemaining = (method: PaymentMethod) => {
    if (remaining > 0) {
      const currentValNum = parseFloat(methodValues[method].replace(/\./g, '').replace(',', '.')) || 0;
      const newVal = (currentValNum + remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setMethodValues(prev => ({ ...prev, [method]: newVal }));
    }
  };

  const clearMethod = (method: PaymentMethod) => {
    setMethodValues(prev => ({ ...prev, [method]: '0,00' }));
  };

  const handleFinalize = useCallback(() => {
    if (!isPaid) return;

    const payments: Payment[] = Object.entries(methodValues)
      .map(([method, value]) => ({
        method: method as PaymentMethod,
        amount: parseFloat((value as string).replace(/\./g, '').replace(',', '.')) || 0
      }))
      .filter(p => p.amount > 0);

    onFinalize(payments, change);
  }, [isPaid, methodValues, onFinalize, change]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'F5') {
            e.preventDefault();
            if (isPaid) handleFinalize();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPaid, handleFinalize]);

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.DINHEIRO: return <Wallet size={20} className="text-green-600" />;
      case PaymentMethod.PIX: return <Smartphone size={20} className="text-theme-green" />;
      case PaymentMethod.DEBITO: return <CreditCard size={20} className="text-theme-darkblue" />;
      case PaymentMethod.CREDITO: return <CreditCard size={20} className="text-theme-secondary" />;
      case PaymentMethod.NOTINHA: return <User size={20} className="text-red-500" />;
      default: return <DollarSign size={20} />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar Pagamento"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="success" 
            onClick={handleFinalize} 
            disabled={!isPaid}
            className="px-8 py-3 text-lg font-black"
          >
            <Check size={20} /> Finalizar Venda (F5)
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-2xl border-b-4 border-theme-primary">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total da Venda</p>
            <p className="text-3xl font-black text-theme-primary">{formatCurrency(totalAmount)}</p>
          </div>
          
          {change > 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl border-b-4 border-blue-500 animate-pulse">
              <p className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest">Troco</p>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{formatCurrency(change)}</p>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border-b-4 transition-colors ${isPaid ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} dark:bg-gray-800`}>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{isPaid ? 'Recebido' : 'Faltando'}</p>
              <p className={`text-3xl font-black ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                {isPaid ? formatCurrency(totalReceived) : formatCurrency(remaining)}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Formas de Recebimento</h3>
             <span className="text-[9px] font-bold text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-tighter">F5 para concluir</span>
          </div>
          <div className="space-y-2">
            {Object.values(PaymentMethod).map((method) => (
              <div 
                key={method} 
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-theme-primary transition-all rounded-2xl group shadow-sm"
              >
                <div className="flex items-center gap-3 w-32 shrink-0">
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">{getMethodIcon(method)}</div>
                  <span className="font-bold text-xs text-gray-700 dark:text-gray-300">{method}</span>
                </div>

                <div className="relative flex-grow">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={methodValues[method]}
                    onFocus={() => handleFocus(method)}
                    onChange={(e) => handleValueChange(method, e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-right font-mono text-xl font-black focus:ring-2 focus:ring-theme-primary outline-none"
                    placeholder="0,00"
                  />
                </div>

                <div className="flex gap-1 shrink-0">
                   <button 
                    onClick={() => fillRemaining(method)}
                    className="px-3 py-3 bg-theme-primary/10 text-theme-primary hover:bg-theme-primary hover:text-white rounded-xl text-[10px] font-black uppercase transition-all"
                  >
                    Resto
                  </button>
                  <button 
                    onClick={() => clearMethod(method)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  >
                    <ArrowRight size={16} className="rotate-180" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
