
import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { OrderType } from '../../types';
import type { Customer, SaleItem, ParkedSale, DeliveryZone } from '../../types';
import { db } from '../../services/databaseService';
import { Store, Truck, User, Phone, MapPin, AlertCircle, MapPinned } from 'lucide-react';
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
  
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType(OrderType.RETIRADA);
      setPhone(customer?.cellphone || customer?.phone || '');
      setAddress(customer?.address || '');
      setNotes('');
      setError('');
      
      // Carrega zonas e tenta pré-selecionar a do cliente
      db.getAll('deliveryZones').then(data => {
          const sorted = data.sort((a,b) => a.neighborhood.localeCompare(b.neighborhood));
          setZones(sorted);
          
          if (customer?.neighborhoodId) {
              const zone = sorted.find(z => z.id === customer.neighborhoodId);
              if (zone) {
                  setSelectedZone(zone);
                  // Se o cliente tem bairro, assume-se que é entrega por padrão
                  setType(OrderType.ENTREGA);
              } else {
                  setSelectedZone(null);
              }
          } else {
              setSelectedZone(null);
          }
      });
    }
  }, [isOpen, customer]);

  const handleConfirm = () => {
    if (type === OrderType.ENTREGA) {
      if (!customer && !phone.trim()) {
        setError('Para entrega, informe ao menos um telefone de contato.');
        return;
      }
      if (!address.trim()) {
        setError('Endereço é obrigatório para entregas.');
        return;
      }
    }

    const parkedSale: ParkedSale = {
      id: uuidv4(),
      createdAt: new Date(),
      items,
      total: total + (type === OrderType.ENTREGA ? (selectedZone?.fee || 0) : 0),
      type,
      customerId: customer?.id,
      customerName: customer?.name || 'Cliente de Balcão',
      contactPhone: phone,
      deliveryAddress: address,
      notes,
      deliveryFee: type === OrderType.ENTREGA ? selectedZone?.fee : 0,
      neighborhood: type === OrderType.ENTREGA ? selectedZone?.neighborhood : undefined
    };

    onSave(parkedSale);
    onClose();
  };

  const finalTotal = total + (type === OrderType.ENTREGA ? (selectedZone?.fee || 0) : 0);

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

        <div className="space-y-4">
          {type === OrderType.ENTREGA && (
            <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
               <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Selecione o Bairro (Frete)</label>
                    <div className="relative">
                        <MapPinned size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select 
                            value={selectedZone?.id || ''}
                            onChange={e => {
                                const zone = zones.find(z => z.id === e.target.value);
                                setSelectedZone(zone || null);
                            }}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-theme-primary outline-none"
                        >
                            <option value="">Selecione o bairro...</option>
                            {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.neighborhood} - {z.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Telefone de Contato</label>
                        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl pt-6 pb-2 px-3 shadow-sm">
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
                        <div className="flex items-start bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl pt-6 pb-2 px-3 shadow-sm">
                        <MapPin size={18} className="text-gray-400 mr-2 mt-1" />
                        <textarea
                            rows={1}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Rua, Número, Ponto ref..."
                            className="w-full bg-transparent outline-none font-medium resize-none text-sm"
                        />
                        </div>
                    </div>
                </div>
            </div>
          )}

          <div className="relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase absolute left-3 top-2">Observações / Notas</label>
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl pt-6 pb-2 px-3 shadow-sm">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Embalar para presente, Troco para R$ 100..."
                className="w-full bg-transparent outline-none"
              />
            </div>
          </div>

          <div className="bg-theme-primary/5 p-4 rounded-2xl border border-theme-primary/20 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Resumo Financeiro</p>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Itens: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} + Frete: {(selectedZone?.fee || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Total Geral</p>
                    <p className="text-2xl font-black text-theme-primary leading-tight">{finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SaveOrderModal;
