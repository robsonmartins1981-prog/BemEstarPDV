
import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { formatCurrency, formatDecimal, parseCurrencyInput } from '../../utils/formatUtils';
import { PaymentMethod } from '../../types';
import { CreditCard, Banknote, QrCode, User, Receipt, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onFinalize: (payments: { method: PaymentMethod; amount: number }[], change: number, shouldPrint: boolean) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onFinalize }) => {
  const [amountPaid, setAmountPaid] = useState(formatDecimal(totalAmount));
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [change, setChange] = useState(0);
  const [shouldPrint, setShouldPrint] = useState(() => {
    const saved = localStorage.getItem('pos_should_print');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    setAmountPaid(formatDecimal(totalAmount));
  }, [totalAmount]);

  useEffect(() => {
    const numericPaid = parseCurrencyInput(amountPaid);
    setChange(Math.max(0, numericPaid - totalAmount));
  }, [amountPaid, totalAmount]);

  const handleConfirm = () => {
    const numericPaid = parseCurrencyInput(amountPaid);
    if (numericPaid < totalAmount) {
      alert('O valor pago é menor que o total da venda.');
      return;
    }
    
    localStorage.setItem('pos_should_print', shouldPrint.toString());
    onFinalize([{ method: selectedMethod, amount: totalAmount }], change, shouldPrint);
  };

  const methods = [
    { id: PaymentMethod.DINHEIRO, label: 'Dinheiro', icon: Banknote, color: 'emerald' },
    { id: PaymentMethod.PIX, label: 'PIX', icon: QrCode, color: 'blue' },
    { id: PaymentMethod.DEBITO, label: 'Débito', icon: CreditCard, color: 'indigo' },
    { id: PaymentMethod.CREDITO, label: 'Crédito', icon: CreditCard, color: 'violet' },
    { id: PaymentMethod.NOTINHA, label: 'Notinha', icon: User, color: 'amber' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar Pagamento"
      size="lg"
      footer={
        <div className="flex gap-4 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1 py-6" onClick={handleConfirm}>
            <CheckCircle2 className="mr-2" /> Confirmar Venda
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Total a Pagar</p>
            <p className="text-4xl font-black text-theme-primary">{formatCurrency(totalAmount)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${selectedMethod === method.id ? 'border-theme-primary bg-theme-primary/5 text-theme-primary' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-500'}`}
              >
                <method.icon className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Valor Recebido (R$)</label>
            <input
              type="text"
              value={amountPaid}
              onChange={(e) => setAmountPaid(formatDecimal(parseCurrencyInput(e.target.value)))}
              className="w-full px-6 py-8 bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-3xl outline-none focus:border-theme-primary transition-all text-5xl font-black text-right font-mono"
              autoFocus
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-2">Troco a Devolver</p>
            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(change)}</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <input
              type="checkbox"
              id="shouldPrint"
              checked={shouldPrint}
              onChange={(e) => setShouldPrint(e.target.checked)}
              className="w-6 h-6 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"
            />
            <label htmlFor="shouldPrint" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Imprimir Comanda / Nota Fiscal
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
