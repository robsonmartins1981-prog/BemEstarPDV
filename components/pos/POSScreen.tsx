
import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SaleItem, Sale, Product, CashTransaction, Payment, Customer, ParkedSale, Coupon } from '../../types';
import { db } from '../../services/databaseService';
import { CashSessionContext } from '../../App';
import { addToQueue } from '../../services/syncService'; 

import ProductSearch from './ProductSearch';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import CashOperationsModal from '../cash/CashOperationsModal';
import CustomerModal from './CustomerModal';
import ParkedSalesScreen from './ParkedSalesScreen'; 
import TodaySalesScreen from './TodaySalesScreen'; 
import SaveOrderModal from './SaveOrderModal';
import Button from '../shared/Button';
import { LogOut, DollarSign, ArrowRightLeft, UserPlus, Save, ListOrdered, UserCircle, Edit, X, Briefcase, Tag, Percent, Ticket, XCircle, Sun, Sunset, Moon, ReceiptText, ArrowLeft, ShoppingCart } from 'lucide-react';

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface POSScreenProps {
  setView: (view: 'pos' | 'erp' | 'crm' | 'fiscal') => void;
}

const POSScreen: React.FC<POSScreenProps> = ({ setView }) => {
  const { session, setSession, setShowCloseScreen, handleOpenSession } = useContext(CashSessionContext);
  
  const [activeSubView, setActiveSubView] = useState<'checkout' | 'parked' | 'today'>('checkout');

  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [includeCpf, setIncludeCpf] = useState(false);
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });
  const [manualDiscount, setManualDiscount] = useState<{ type: 'PERCENTAGE' | 'FIXED_AMOUNT' | null; value: number }>({ type: null, value: 0 });
  const [percentageDiscountInput, setPercentageDiscountInput] = useState('');
  const [fixedDiscountInput, setFixedDiscountInput] = useState('');
  
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isCashOpsModalOpen, setCashOpsModalOpen] = useState(false);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [isSaveOrderModalOpen, setSaveOrderModalOpen] = useState(false);

  const [initialAmount, setInitialAmount] = useState('');
  const [selectedShift, setSelectedShift] = useState<'Caixa 01 (Manhã)' | 'Caixa 02 (Tarde)' | 'Caixa 03 (Noite)'>('Caixa 01 (Manhã)');
  const [openError, setOpenError] = useState('');

  const handleSubmitOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(initialAmount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount < 0) {
      setOpenError('Por favor, insira um valor de suprimento válido.'); return;
    }
    setOpenError('');
    handleOpenSession(numericAmount, selectedShift);
  };

  useEffect(() => {
    if (selectedCustomer) {
      setIncludeCpf(true);
      setCpf(selectedCustomer.cpf);
      setCpfError('');
    } else {
      setIncludeCpf(false);
      setCpf('');
      setCpfError('');
    }
  }, [selectedCustomer]);

  const validateCpf = (value: string) => {
    if (!value) { setCpfError('CPF é obrigatório quando a opção está marcada.'); return false; }
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(value)) { setCpfError('Formato inválido. Use ###.###.###-##'); return false; }
    setCpfError('');
    return true;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCpf(value);
    if (cpfError) validateCpf(value);
  };
  const handleCpfBlur = () => { if (includeCpf) validateCpf(cpf); };

  const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + item.total, 0), [cartItems]);

  const calculatedDiscount = useMemo(() => {
    if (manualDiscount.type) {
      if (manualDiscount.type === 'PERCENTAGE') {
        return subtotal * (manualDiscount.value / 100);
      }
      return Math.min(subtotal, manualDiscount.value);
    }
    if (appliedCoupon) {
      if (appliedCoupon.type === 'PERCENTAGE') {
        return subtotal * (appliedCoupon.value / 100);
      }
      return Math.min(subtotal, appliedCoupon.value);
    }
    return 0;
  }, [subtotal, manualDiscount, appliedCoupon]);

  const total = subtotal - calculatedDiscount;

  const clearSaleState = () => {
    setCartItems([]);
    setSelectedCustomer(null); 
    setCouponCodeInput('');
    setAppliedCoupon(null);
    setCouponMessage({ type: '', text: '' });
    handleRemoveManualDiscount();
  };
  
  const handleAddProduct = useCallback((product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.unitPrice - item.discount } : item
        );
      } else {
        const newItem: SaleItem = {
          productId: product.id, productName: product.name, productImage: product.image,
          unitPrice: product.price, quantity: quantity, discount: 0, total: product.price * quantity,
        };
        return [...prevItems, newItem];
      }
    });
  }, []);

  const handleRemoveItem = useCallback((productId: string) => setCartItems(prev => prev.filter(item => item.productId !== productId)), []);
  const handleUpdateQuantity = useCallback((productId: string, newQuantity: number) => {
    setCartItems(prev => prev.map(item => item.productId === productId ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice - item.discount } : item));
  }, []);
  const handleUpdateDiscount = useCallback((productId: string, newDiscount: number) => { 
    setCartItems(prev => prev.map(item => item.productId === productId ? { ...item, discount: newDiscount, total: item.quantity * item.unitPrice - newDiscount } : item));
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setCouponMessage({ type: '', text: '' });
    
    const code = couponCodeInput.trim().toUpperCase();
    const coupon = await db.getFromIndex('coupons', 'code', code);
    
    if (!coupon) { setCouponMessage({ type: 'error', text: 'Cupom inválido.' }); return; }
    if (coupon.isActive === 0) { setCouponMessage({ type: 'error', text: 'Cupom inativo.' }); return; }
    if (new Date() > new Date(coupon.expiryDate)) { setCouponMessage({ type: 'error', text: 'Cupom expirado.' }); return; }
    if (coupon.currentUses >= coupon.maxUses) { setCouponMessage({ type: 'error', text: 'Limite de usos atingido.' }); return; }

    setAppliedCoupon(coupon);
    handleRemoveManualDiscount(); 
    setCouponMessage({ type: 'success', text: 'Cupom aplicado!' });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponMessage({ type: '', text: '' });
  };

  const handlePercentageDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPercentageDiscountInput(value);
    setFixedDiscountInput(''); 

    if (!value) {
        setManualDiscount({ type: null, value: 0 });
        return;
    }

    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
        setManualDiscount({ type: 'PERCENTAGE', value: numericValue });
        setAppliedCoupon(null); setCouponMessage({ type: '', text: '' }); setCouponCodeInput(''); 
    }
  };

  const handleFixedDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFixedDiscountInput(value);
    setPercentageDiscountInput(''); 

    if (!value) {
        setManualDiscount({ type: null, value: 0 });
        return;
    }
    
    const numericValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numericValue) && numericValue >= 0) {
        setManualDiscount({ type: 'FIXED_AMOUNT', value: numericValue });
        setAppliedCoupon(null); setCouponMessage({ type: '', text: '' }); setCouponCodeInput(''); 
    }
  };

  const handleRemoveManualDiscount = () => {
    setManualDiscount({ type: null, value: 0 });
    setPercentageDiscountInput('');
    setFixedDiscountInput('');
  };

  const handleFinalizeSale = useCallback(async (payments: Payment[], change: number) => {
    if (!session) return;
    
    const tx = db.transaction(['cashSessions', 'coupons', 'sales'], 'readwrite');
    const newSale: Sale = {
      id: uuidv4(), date: new Date(), items: cartItems, subtotal,
      totalDiscount: calculatedDiscount, totalAmount: total, payments, change,
      customerCPF: includeCpf ? cpf : undefined, customerId: selectedCustomer?.id,
      isSynced: false,
      couponCodeApplied: appliedCoupon?.code,
      manualDiscountType: manualDiscount.type ?? undefined,
      manualDiscountValue: manualDiscount.value || undefined,
    };
    
    const updatedSession = { ...session, sales: [...session.sales, newSale] };
    // Usamos put() em vez de add() para maior resiliência em falhas de transação
    await tx.objectStore('cashSessions').put(updatedSession);
    await tx.objectStore('sales').put(newSale); 
    
    if (appliedCoupon) {
      const couponStore = tx.objectStore('coupons');
      const couponToUpdate = await couponStore.get(appliedCoupon.id);
      if (couponToUpdate) {
        couponToUpdate.currentUses += 1;
        await couponStore.put(couponToUpdate);
      }
    }
    
    await tx.done;
    setSession(updatedSession);
    
    addToQueue('FISCAL_EMISSION', { saleId: newSale.id });

    clearSaleState();
    setPaymentModalOpen(false);
  }, [cartItems, session, setSession, subtotal, total, calculatedDiscount, selectedCustomer, includeCpf, cpf, appliedCoupon, manualDiscount]);
  
  const handleConfirmParkSale = async (parkedSale: ParkedSale) => {
    await db.put('parkedSales', parkedSale);
    clearSaleState();
    setSaveOrderModalOpen(false);
  };

  const handleLoadParkedSale = useCallback(async (sale: ParkedSale) => {
    setCartItems(sale.items);
    if (sale.customerId) {
      const customer = await db.get('customers', sale.customerId);
      if (customer) setSelectedCustomer(customer);
    } else {
      setSelectedCustomer(null);
    }
    await db.delete('parkedSales', sale.id);
    setActiveSubView('checkout');
  }, []);

  const handleCashOperation = useCallback(async (transaction: CashTransaction) => {
    if (!session) return;
    const updatedSession = { ...session, transactions: [...session.transactions, transaction] };
    await db.put('cashSessions', updatedSession);
    setSession(updatedSession);
    setCashOpsModalOpen(false);
  }, [session, setSession]);

  const handleSelectCustomer = (customer: Customer) => { setSelectedCustomer(customer); setCustomerModalOpen(false); };
  const handleRemoveCustomer = () => setSelectedCustomer(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F12' && cartItems.length > 0 && activeSubView === 'checkout') { event.preventDefault(); setPaymentModalOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, activeSubView]);
  
  const isPayButtonDisabled = cartItems.length === 0 || (includeCpf && (!!cpfError || !cpf));

  if (!session) { 
    return (
      <div className="flex flex-col h-full items-center justify-center bg-gray-50 dark:bg-gray-900/50 p-4">
        <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl text-center">
            <div className="inline-block p-4 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-full mb-4">
                <Briefcase className="w-16 h-16 text-theme-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Bem Estar Gestão</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Selecione o turno e o valor inicial para iniciar as vendas.</p>
            
            <form onSubmit={handleSubmitOpenSession} className="space-y-6 mt-8 text-left">
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Turno de Trabalho
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedShift('Caixa 01 (Manhã)')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${selectedShift === 'Caixa 01 (Manhã)' ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' : 'border-gray-200 dark:border-gray-700 hover:border-theme-primary/50'}`}
                        >
                            <Sun className="mb-2" size={24} />
                            <span className="text-xs font-bold">Manhã</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedShift('Caixa 02 (Tarde)')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${selectedShift === 'Caixa 02 (Tarde)' ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' : 'border-gray-200 dark:border-gray-700 hover:border-theme-primary/50'}`}
                        >
                            <Sunset className="mb-2" size={24} />
                            <span className="text-xs font-bold">Tarde</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedShift('Caixa 03 (Noite)')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${selectedShift === 'Caixa 03 (Noite)' ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' : 'border-gray-200 dark:border-gray-700 hover:border-theme-primary/50'}`}
                        >
                            <Moon className="mb-2" size={24} />
                            <span className="text-xs font-bold">Noite</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="initialAmount" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                        Suprimento Inicial de Troco
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">R$</span>
                        <input
                            id="initialAmount"
                            type="text"
                            value={initialAmount}
                            onChange={(e) => setInitialAmount(e.target.value)}
                            placeholder="0,00"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-theme-primary focus:border-theme-primary bg-gray-50 dark:bg-gray-700 text-2xl text-right font-mono"
                            autoFocus
                        />
                    </div>
                    {openError && <p className="mt-2 text-sm text-red-600 font-medium">{openError}</p>}
                </div>

                <Button type="submit" className="w-full text-lg py-4 rounded-xl" variant="primary">
                    Abrir {selectedShift}
                </Button>
            </form>
        </div>
      </div>
    ); 
  }

  const renderActiveView = () => {
    switch(activeSubView) {
      case 'parked':
        return <ParkedSalesScreen onBack={() => setActiveSubView('checkout')} onLoadSale={handleLoadParkedSale} />;
      case 'today':
        return <TodaySalesScreen onBack={() => setActiveSubView('checkout')} />;
      case 'checkout':
      default:
        return (
          <main className="flex-grow flex flex-col lg:grid lg:grid-cols-5 gap-4 p-4 overflow-y-auto lg:overflow-hidden">
            <div className="lg:col-span-3 flex flex-col gap-4 lg:overflow-hidden h-auto lg:h-full shrink-0">
              <ProductSearch onAddProduct={handleAddProduct} />
              <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col min-h-[300px]">
                <div className="flex-grow overflow-y-auto max-h-[50vh] lg:max-h-full">
                   <Cart items={cartItems} onRemove={handleRemoveItem} onUpdateQuantity={handleUpdateQuantity} onUpdateDiscount={handleUpdateDiscount} customerName={selectedCustomer?.name} />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 flex flex-col h-auto shrink-0 mb-8 lg:mb-0">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 hidden lg:block">Resumo da Venda</h2>
              
               {selectedCustomer && ( 
                  <div className="mb-4 p-3 md:p-4 bg-theme-primary/10 dark:bg-theme-primary/20 border border-theme-primary/20 dark:border-theme-primary/40 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserCircle className="w-8 h-8 text-theme-primary shrink-0" />
                        <div className="overflow-hidden">
                            <p className="font-bold text-base leading-tight truncate">{selectedCustomer.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.cpf}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="secondary" className="!p-2 h-auto" onClick={() => setCustomerModalOpen(true)} title="Trocar Cliente"><Edit size={16} /></Button>
                        <Button variant="danger" className="!p-2 h-auto" onClick={handleRemoveCustomer} title="Remover Cliente"><X size={16} /></Button>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <label htmlFor="cpf-toggle" className="font-semibold select-none cursor-pointer text-sm">CPF na Nota?</label>
                        <input type="checkbox" id="cpf-toggle" checked={includeCpf} onChange={(e) => { setIncludeCpf(e.target.checked); if (!e.target.checked) { setCpf(''); setCpfError(''); } }} className="h-5 w-5 text-theme-primary bg-gray-100 border-gray-300 rounded focus:ring-theme-primary"/>
                    </div>
                    {includeCpf && ( <div className="mt-2"><input type="text" value={cpf} onChange={handleCpfChange} onBlur={handleCpfBlur} placeholder="Digite o CPF" className={`w-full px-4 py-2 border rounded-md dark:bg-gray-700 ${cpfError ? 'border-red-500' : 'dark:border-gray-600'}`}/> {cpfError && <p className="mt-1 text-sm text-red-600">{cpfError}</p>}</div> )}
                </div>

                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                    <h3 className="font-semibold text-sm">Descontos</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Percent size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="number"
                                placeholder="%"
                                value={percentageDiscountInput}
                                onChange={handlePercentageDiscountChange}
                                onBlur={() => { if(percentageDiscountInput) setPercentageDiscountInput(parseFloat(percentageDiscountInput).toString()) }}
                                disabled={!!appliedCoupon}
                                className="w-full text-right pl-7 pr-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800"
                            />
                        </div>
                        <div className="relative flex-1">
                            <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="R$"
                                value={fixedDiscountInput}
                                onChange={handleFixedDiscountChange}
                                disabled={!!appliedCoupon}
                                className="w-full text-right pl-7 pr-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="text" value={couponCodeInput} onChange={e => setCouponCodeInput(e.target.value)} placeholder="Cód. Cupom" className="flex-grow px-3 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600" disabled={!!manualDiscount.type} />
                        <Button size="sm" onClick={handleApplyCoupon} disabled={!!manualDiscount.type || !couponCodeInput} className="text-xs">Aplicar</Button>
                    </div>
                    {couponMessage.text && <p className={`text-xs ${couponMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{couponMessage.text}</p>}
                    {appliedCoupon && (
                        <div className="flex items-center justify-between p-2 bg-theme-secondary/10 text-theme-secondary rounded-md text-sm font-semibold">
                           <span><Ticket size={14} className="inline mr-1"/> {appliedCoupon.code}</span>
                           <button onClick={handleRemoveCoupon}><XCircle size={16}/></button>
                        </div>
                    )}
                </div>

              <div className="space-y-1 md:space-y-3 text-lg flex-grow">
                <div className="flex justify-between text-sm md:text-base"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm md:text-base"><span className="text-gray-600 dark:text-gray-400">Descontos</span><span className="font-semibold text-green-600">-{formatCurrency(calculatedDiscount)}</span></div>
                <hr className="my-2 border-gray-200 dark:border-gray-700"/>
                <div className="flex justify-between items-center text-2xl md:text-4xl font-bold text-theme-primary"><span>TOTAL</span><span>{formatCurrency(total)}</span></div>
              </div>
              
              <div className="mt-auto pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => setSaveOrderModalOpen(true)} disabled={cartItems.length === 0} className="text-xs md:text-sm">
                        <Save className="w-4 h-4 mr-1"/> <span className="hidden md:inline">Salvar Pedido</span><span className="md:hidden">Salvar</span>
                    </Button>
                    <Button variant="secondary" onClick={() => setCustomerModalOpen(true)} className="text-xs md:text-sm">
                        <UserPlus className="w-4 h-4 mr-1"/> Cliente
                    </Button>
                </div>
                <Button variant="success" className="w-full text-lg py-3" onClick={() => setPaymentModalOpen(true)} disabled={isPayButtonDisabled}>
                    <DollarSign className="w-6 h-6 mr-2"/> PAGAR (F12)
                </Button>
              </div>

            </div>
          </main>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
       <header className="flex items-center justify-between bg-white dark:bg-gray-800 shadow-md p-3 px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
            {activeSubView !== 'checkout' && (
              <button 
                onClick={() => setActiveSubView('checkout')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-theme-primary"
                title="Voltar para Venda"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex flex-col">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">PDV - Bem Estar</h1>
                <span className="text-[10px] font-bold text-theme-primary uppercase">{session.shiftName}</span>
            </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant={activeSubView === 'parked' ? 'primary' : 'secondary'} 
              className="!p-2 md:!px-4 md:!py-2" 
              onClick={() => setActiveSubView('parked')} 
              title="Gerenciar Pedidos"
            >
                <ListOrdered className="w-4 h-4 md:mr-2"/>
                <span className="hidden md:inline">Pedidos</span>
            </Button>
            <Button 
              variant={activeSubView === 'today' ? 'primary' : 'secondary'} 
              className="!p-2 md:!px-4 md:!py-2" 
              onClick={() => setActiveSubView('today')} 
              title="Vendas Realizadas Hoje"
            >
                <ReceiptText className="w-4 h-4 md:mr-2"/>
                <span className="hidden md:inline">Vendas</span>
            </Button>
            <Button variant="secondary" className="!p-2 md:!px-4 md:!py-2" onClick={() => setCashOpsModalOpen(true)} title="Movimentar Caixa">
                <ArrowRightLeft className="w-4 h-4 md:mr-2"/>
                 <span className="hidden md:inline">Movimentar</span>
            </Button>
            <Button variant="danger" className="!p-2 md:!px-4 md:!py-2" onClick={() => setShowCloseScreen(true)} title="Fechar Caixa">
                <LogOut className="w-4 h-4 md:mr-2"/>
                 <span className="hidden md:inline">Fechar</span>
            </Button>
        </div>
      </header>

      {/* Renderização Dinâmica de Janelas */}
      <div className="flex-grow overflow-hidden relative">
        {renderActiveView()}
      </div>

      {/* Modais de Operação Curta */}
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} totalAmount={total} onFinalize={handleFinalizeSale} />
      <CashOperationsModal isOpen={isCashOpsModalOpen} onClose={() => setCashOpsModalOpen(false)} onConfirm={handleCashOperation} />
      <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setCustomerModalOpen(false)} onSelectCustomer={handleSelectCustomer} />
      <SaveOrderModal 
        isOpen={isSaveOrderModalOpen} 
        onClose={() => setSaveOrderModalOpen(false)} 
        items={cartItems} 
        total={total} 
        customer={selectedCustomer} 
        onSave={handleConfirmParkSale} 
      />
    </div>
  );
};

export default POSScreen;
