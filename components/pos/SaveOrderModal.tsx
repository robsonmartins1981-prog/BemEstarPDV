
import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { OrderType } from '../../types';
import type { Customer, SaleItem, ParkedSale } from '../../types';
import { Store, Truck, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SaveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SaleItem[];
  total: number;
  customer: Customer | null;
  onSave: (parkedSale: ParkedSale) => void;
}

const SaveOrderModal: React.FC<SaveOrderModalProps> = ({ isOpen, onClose, items, total, customer, onSave }) => {
  const [type, setType] = useState<OrderType>(OrderType.RETIRADA);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(OrderType.RETIRADA);
      setPhone(customer?.phone || '');
      setAddress(customer?.address || '');
      setNotes('');
      setError('');
    }
  }, [isOpen, customer]);

  const handleConfirm = () => {
    if (type === OrderType.ENTREGA) {
      if (!customer) {
        setError('Para entrega, é necessário selecionar um cliente primeiro.');
        return;
      }
      if (!phone.trim() || !address.trim()) {
        setError('Telefone e Endereço são obrigatórios para entregas.');
        return;
      }
    }

    const parkedSale: ParkedSale = {
      id: uuidv4(),
      createdAt: new Date(),
      items,
      total,
      type,
      customerId: customer?.id,
      customerName: customer?.name || 'Cliente de Balcão',
      contactPhone: phone,
      deliveryAddress: address,
      notes
    };

    onSave(parkedSale);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Salvar Pedido / Encomenda"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirmar e Salvar</Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Seleção de Tipo */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => { setType(OrderType.RETIRADA); setError(''); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${type === OrderType.RETIRADA ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
          >
            <Store size={32} />
            <span className="font-bold">Retirada na Loja</span>
          </button>
          <button
            onClick={() => { setType(OrderType.ENTREGA); setError(''); }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${type === OrderType.ENTREGA ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
          >
            <Truck size={32} />
            <span className="font-bold">Entrega / Delivery</span>
          </button>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Detalhes do Cliente */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <User className="text-gray-400" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Cliente</p>
              <p className="font-semibold">{customer?.name || 'Cliente de Balcão'}</p>
            </div>
          </div>

          {type === OrderType.ENTREGA && (
            <>
              <div className="relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Telefone de Contato</label>
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg pt-6 pb-2 px-3">
                  <Phone size={18} className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-transparent outline-none font-medium"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Endereço de Entrega</label>
                <div className="flex items-start bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg pt-6 pb-2 px-3">
                  <MapPin size={18} className="text-gray-400 mr-2 mt-1" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, Número, Bairro, Ponto de referência..."
                    className="w-full bg-transparent outline-none font-medium resize-none text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div className="relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Observações / Notas</label>
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg pt-6 pb-2 px-3">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Embalar para presente, Troco para R$ 100..."
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SaveOrderModal;
