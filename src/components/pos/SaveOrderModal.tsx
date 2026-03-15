
import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { Save } from 'lucide-react';

interface SaveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  total: number;
  customer: any;
  onSave: (parkedSale: any) => void;
}

const SaveOrderModal: React.FC<SaveOrderModalProps> = ({ isOpen, onClose, onSave, items, total, customer }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Salvar Pedido / Delivery" size="md">
      <div className="space-y-6">
        <p className="text-sm text-gray-500">Deseja salvar este pedido para finalização posterior ou entrega?</p>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total do Pedido</p>
          <p className="text-2xl font-black text-theme-primary">R$ {total.toFixed(2)}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1" onClick={() => onSave({
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            items,
            total,
            type: 'Entrega',
            customerId: customer?.id,
            customerName: customer?.name
          })}>
            <Save size={18} className="mr-2" /> Salvar Pedido
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SaveOrderModal;
