import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { OrderType, PaymentMethod } from '../../types';
import type { ParkedSale, Customer, DeliveryZone, Payment } from '../../types';
import { db } from '../../services/databaseService';
import { Truck, User, Phone, MapPin, DollarSign } from 'lucide-react';

interface EditDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: ParkedSale | null;
  onSave: (updatedSale: ParkedSale) => void;
  onComplete?: (updatedSale: ParkedSale) => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const EditDeliveryModal: React.FC<EditDeliveryModalProps> = ({ isOpen, onClose, sale, onSave, onComplete }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [fee, setFee] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (isOpen && sale) {
      setCustomerName(sale.customerName || '');
      setPhone(sale.contactPhone || '');
      setAddress(sale.deliveryAddress || '');
      setNotes(sale.notes || '');
      setFee(sale.deliveryFee?.toString() || '');
      setNeighborhood(sale.neighborhood || '');
      
      if (sale.payments && sale.payments.length > 0) {
        setPaymentMethod(sale.payments[0].method);
        setPaymentAmount(sale.payments[0].amount.toString());
      } else {
        setPaymentMethod(PaymentMethod.DINHEIRO);
        setPaymentAmount(sale.total.toString());
      }

      db.getAll('customers').then(data => setCustomers(data));
      db.getAll('deliveryZones').then(data => {
          const sorted = data.sort((a,b) => a.neighborhood.localeCompare(b.neighborhood));
          setZones(sorted);
          if (sale.neighborhood) {
              const zone = sorted.find(z => z.neighborhood === sale.neighborhood);
              if (zone) setSelectedZone(zone);
          }
      });
      
      if (sale.customerId) {
          db.get('customers', sale.customerId).then(c => {
              if (c) setSelectedCustomer(c);
          });
      } else {
          setSelectedCustomer(null);
      }
    }
  }, [isOpen, sale]);

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const zoneId = e.target.value;
      const zone = zones.find(z => z.id === zoneId);
      if (zone) {
          setSelectedZone(zone);
          setNeighborhood(zone.neighborhood);
          setFee(zone.fee.toString());
      } else {
          setSelectedZone(null);
          setNeighborhood('');
          setFee('');
      }
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const customerId = e.target.value;
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
          setSelectedCustomer(customer);
          setCustomerName(customer.name);
          setPhone(customer.cellphone || customer.phone || '');
          setAddress(customer.address || '');
          if (customer.neighborhoodId) {
              const zone = zones.find(z => z.id === customer.neighborhoodId);
              if (zone) {
                  setSelectedZone(zone);
                  setNeighborhood(zone.neighborhood);
                  setFee(zone.fee.toString());
              }
          }
      } else {
          setSelectedCustomer(null);
      }
  };

  const handleSave = () => {
    if (!sale) return;
    
    const numericFee = parseFloat(fee.replace(',', '.')) || 0;
    const numericPayment = parseFloat(paymentAmount.replace(',', '.')) || 0;
    
    // Calculate new total (subtotal of items + new fee)
    const itemsTotal = sale.items.reduce((acc, item) => acc + item.total, 0);
    const newTotal = itemsTotal + numericFee;

    const updatedSale: ParkedSale = {
      ...sale,
      type: OrderType.ENTREGA,
      customerName: customerName || 'Cliente',
      customerId: selectedCustomer?.id,
      contactPhone: phone,
      deliveryAddress: address,
      neighborhood: neighborhood,
      deliveryFee: numericFee,
      notes: notes,
      total: newTotal,
      payments: [{ method: paymentMethod, amount: numericPayment || newTotal }]
    };

    onSave(updatedSale);
  };

  const handleComplete = () => {
    if (!sale || !onComplete) return;
    
    const numericFee = parseFloat(fee.replace(',', '.')) || 0;
    const numericPayment = parseFloat(paymentAmount.replace(',', '.')) || 0;
    
    const itemsTotal = sale.items.reduce((acc, item) => acc + item.total, 0);
    const newTotal = itemsTotal + numericFee;

    const updatedSale: ParkedSale = {
      ...sale,
      type: OrderType.ENTREGA,
      customerName: customerName || 'Cliente',
      customerId: selectedCustomer?.id,
      contactPhone: phone,
      deliveryAddress: address,
      neighborhood: neighborhood,
      deliveryFee: numericFee,
      notes: notes,
      total: newTotal,
      payments: [{ method: paymentMethod, amount: numericPayment || newTotal }]
    };

    onComplete(updatedSale);
  };

  if (!sale) return null;

  const itemsTotal = sale.items.reduce((acc, item) => acc + item.total, 0);
  const numericFeeCalc = parseFloat(fee.replace(',', '.')) || 0;
  const currentTotal = itemsTotal + numericFeeCalc;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Entrega">
      <div className="space-y-4">
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center gap-3">
            <Truck className="text-orange-500" size={24} />
            <div>
                <p className="font-bold text-orange-800 dark:text-orange-200">Detalhes da Entrega</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">Preencha os dados para enviar o pedido.</p>
            </div>
        </div>

        <div className="space-y-3">
            <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Vincular Cliente (Opcional)</label>
                <select 
                    className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                    value={selectedCustomer?.id || ''}
                    onChange={handleCustomerSelect}
                >
                    <option value="">-- Selecione um cliente cadastrado --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Nome do Cliente</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full pl-9 p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="Nome" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Telefone</label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-9 p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="(00) 00000-0000" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Endereço de Entrega</label>
                <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-9 p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="Rua, Número, Complemento" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Bairro / Taxa</label>
                    <select 
                        className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                        value={selectedZone?.id || ''}
                        onChange={handleZoneChange}
                    >
                        <option value="">-- Selecione a Região --</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.neighborhood} - {formatCurrency(z.fee)}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Valor do Frete (R$)</label>
                    <input type="number" value={fee} onChange={e => setFee(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="0.00" />
                </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <p className="font-bold text-sm mb-2 flex items-center gap-2"><DollarSign size={16}/> Pagamento na Entrega</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Forma de Pagamento</label>
                        <select 
                            className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                        >
                            {Object.values(PaymentMethod).map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Valor a Cobrar (R$)</label>
                        <input type="number" value={paymentAmount || currentTotal} onChange={e => setPaymentAmount(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 font-bold text-theme-primary" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Observações</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" rows={2} placeholder="Troco para R$ 50, Ponto de referência..." />
            </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <div className="text-lg">
                <span className="text-gray-500 text-sm">Total a Pagar: </span>
                <span className="font-black text-theme-primary">{formatCurrency(currentTotal)}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave}>Salvar</Button>
                {onComplete && (
                    <Button variant="success" onClick={handleComplete}>Concluir Venda</Button>
                )}
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default EditDeliveryModal;
