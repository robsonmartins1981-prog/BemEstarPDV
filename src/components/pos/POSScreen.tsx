
import React, { useState, useCallback, useContext, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { SaleItem, Sale, Product, CashOperation, Payment, Customer, ParkedSale } from '../../types';
import { formatCurrency, formatDecimal, parseCurrencyInput } from '../../utils/formatUtils';
import { safeDate } from '../../utils/dateUtils';
import { db, searchByIndex } from '../../services/databaseService';
import { printReceipt } from '../../utils/printUtils';
import { CashSessionContext } from '../../App';

import ProductSearch from './ProductSearch';
import Cart from './Cart';
import PaymentView from './PaymentView';
import CashOperationsModal from '../cash/CashOperationsModal';
import CustomerModal from './CustomerModal';
import ParkedSalesScreen from './ParkedSalesScreen'; 
import TodaySalesScreen from './TodaySalesScreen'; 
import SaveOrderModal from './SaveOrderModal';
import FiscalReceipt from './FiscalReceipt';
import Button from '../shared/Button';
import { LogOut, DollarSign, ArrowRightLeft, UserPlus, Save, ListOrdered, UserCircle, Edit, X, Briefcase, Tag, Percent, Ticket, XCircle, Sun, Sunset, Moon, ReceiptText, ArrowLeft, ShoppingCart, Settings } from 'lucide-react';
import type { Shortcut, AppConfig } from '../../types';


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

  const [manualDiscount, setManualDiscount] = useState<{ type: 'PERCENTAGE' | 'FIXED_AMOUNT' | null; value: number }>({ type: null, value: 0 });
  const [percentageDiscountInput, setPercentageDiscountInput] = useState('');
  const [fixedDiscountInput, setFixedDiscountInput] = useState('');
  
  const [isPaymentView, setIsPaymentView] = useState(false);
  const [isCashOpsModalOpen, setCashOpsModalOpen] = useState(false);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [isSaveOrderModalOpen, setSaveOrderModalOpen] = useState(false);
  const [isReceiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await db.get('appConfig', 'main');
      const scs = await db.getAll('shortcuts');
      setAppConfig(config || null);
      setShortcuts(scs);
    };
    loadConfig();
  }, []);

  const [initialAmount, setInitialAmount] = useState('');
  const [selectedShift, setSelectedShift] = useState<'Caixa 01 (Manhã)' | 'Caixa 02 (Tarde)' | 'Caixa 03 (Noite)'>('Caixa 01 (Manhã)');
  const [openError, setOpenError] = useState('');

  const handleSubmitOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseCurrencyInput(initialAmount);
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
    return 0;
  }, [subtotal, manualDiscount]);

  const total = subtotal - calculatedDiscount;

  const clearSaleState = () => {
    setCartItems([]);
    setSelectedCustomer(null); 
    handleRemoveManualDiscount();
  };
  
  const handleAddProduct = useCallback((product: Product, quantity: number) => {
    if (!product || !product.id) return;
    const unitPrice = product.price;
    
    setCartItems(prevItems => {
      const items = (prevItems || []).filter(Boolean);
      const existingItem = items.find(item => item.productId === product.id);
      if (existingItem) {
        return items.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * unitPrice - item.discount } : item
        );
      } else {
        const newItem: SaleItem = {
          productId: product.id, productName: product.name, productImage: product.image,
          unitPrice: unitPrice, quantity: quantity, unitType: product.unitType || 'UN', discount: 0, total: unitPrice * quantity,
        };
        return [...items, newItem];
      }
    });
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    handleAddProduct(product, 1);
  }, [handleAddProduct]);

  const handleRemoveItem = useCallback((productId: string) => setCartItems(prev => (prev || []).filter(item => item && item.productId !== productId)), []);
  const handleUpdateQuantity = useCallback((productId: string, newQuantity: number) => {
    setCartItems(prev => (prev || []).filter(Boolean).map(item => item.productId === productId ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice - item.discount } : item));
  }, []);
  const handleUpdateDiscount = useCallback((productId: string, newDiscount: number) => { 
    setCartItems(prev => (prev || []).filter(Boolean).map(item => item.productId === productId ? { ...item, discount: newDiscount, total: item.quantity * item.unitPrice - newDiscount } : item));
  }, []);

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
    }
  };

  const handleRemoveManualDiscount = () => {
    setManualDiscount({ type: null, value: 0 });
    setPercentageDiscountInput('');
    setFixedDiscountInput('');
  };

  const handleFinalizeSale = useCallback(async (payments: Payment[], change: number, shouldPrint: boolean) => {
    if (!session) return;
    
    const newSale: Sale = {
      id: uuidv4(), date: new Date(), items: cartItems, subtotal,
      totalDiscount: calculatedDiscount, totalAmount: total, payments, change,
      customerCPF: includeCpf ? cpf : undefined, customerId: selectedCustomer?.id,
      sessionId: session.id,
      manualDiscountType: manualDiscount.type ?? undefined,
      manualDiscountValue: manualDiscount.value || undefined,
    };

    if (shouldPrint || appConfig?.printAuto) {
      if (appConfig) {
        printReceipt(newSale, appConfig);
      }
    }

    const tx = db.transaction(['cashSessions', 'sales'], 'readwrite');
    
    const updatedSession = { ...session, sales: [...(session.sales || []), newSale] };
    await tx.objectStore('cashSessions').put(updatedSession);
    await tx.objectStore('sales').put(newSale); 
    
    await tx.done;
    setSession(updatedSession);
    
    clearSaleState();
    setIsPaymentView(false);
    
    if (shouldPrint) {
      setLastSale(newSale);
      setReceiptModalOpen(true);
    }
  }, [cartItems, session, setSession, subtotal, total, calculatedDiscount, selectedCustomer, includeCpf, cpf, manualDiscount, appConfig]);
  
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

  const handleFinalizeDelivery = useCallback(async (sale: ParkedSale) => {
    if (!session || !sale.payments || sale.payments.length === 0) return;
    
    const totalPayments = sale.payments.reduce((acc, p) => acc + p.amount, 0);
    const change = Math.max(0, totalPayments - sale.total);

    const tx = db.transaction(['cashSessions', 'sales', 'parkedSales'], 'readwrite');
    const newSale: Sale = {
      id: sale.id,
      date: new Date(), 
      items: sale.items, 
      subtotal: sale.items.reduce((acc, item) => acc + item.total, 0),
      totalDiscount: 0, 
      totalAmount: sale.total, 
      payments: sale.payments, 
      change: change,
      customerId: sale.customerId,
      type: sale.type,
      deliveryAddress: sale.deliveryAddress,
      deliveryFee: sale.deliveryFee,
      contactPhone: sale.contactPhone,
      notes: sale.notes
    };
    
    const updatedSession = { ...session, sales: [...(session.sales || []), newSale] };
    await tx.objectStore('cashSessions').put(updatedSession);
    await tx.objectStore('sales').put(newSale); 
    await tx.objectStore('parkedSales').delete(sale.id);
    
    await tx.done;
    setSession(updatedSession);
  }, [session, setSession]);

  const handleCashOperation = useCallback(async (operation: any) => {
    if (!session) return;
    
    // Buscar a sessão real no banco usando o índice de status
    const openSessions = await searchByIndex('cashSessions', 'status', 'OPEN');
    const realSession = openSessions[0];
    
    if (!realSession) return;

    const newOp: CashOperation = {
      id: uuidv4(),
      sessionId: realSession.id,
      type: operation.type,
      amount: operation.amount,
      date: new Date().toISOString(),
      description: operation.description
    };

    await db.put('cashOperations', newOp);
    
    // Atualizar o estado local para manter compatibilidade se necessário
    // Mas o ideal é que o estado local reflita que houve uma mudança
    setCashOpsModalOpen(false);
  }, [session]);

  const handleSelectCustomer = (customer: Customer) => { setSelectedCustomer(customer); setCustomerModalOpen(false); };
  const handleRemoveCustomer = () => setSelectedCustomer(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global Shortcuts
      const shortcut = (shortcuts || []).find(s => s.key === event.key);
      if (shortcut) {
        event.preventDefault();
        switch (shortcut.action) {
          case 'FINALIZE_SALE':
            if (cartItems.length > 0 && activeSubView === 'checkout') setIsPaymentView(true);
            break;
          case 'OPEN_CUSTOMER_MODAL':
            setCustomerModalOpen(true);
            break;
          case 'OPEN_PRODUCT_SEARCH':
            // Focus product search - we might need a ref for this
            const searchInput = document.querySelector('input[placeholder*="Pesquisar"]') as HTMLInputElement;
            if (searchInput) searchInput.focus();
            break;
          case 'PARK_SALE':
            if (cartItems.length > 0) setSaveOrderModalOpen(true);
            break;
          case 'OPEN_CASH_OPS':
            setCashOpsModalOpen(true);
            break;
          case 'CLEAR_CART':
            if (window.confirm('Limpar carrinho?')) clearSaleState();
            break;
          case 'OPEN_SETTINGS':
            setView('settings');
            break;
          case 'PRINT_LAST_RECEIPT':
            if (lastSale && appConfig) {
              printReceipt(lastSale, appConfig);
            }
            break;
          case 'LOGOUT':
            setShowCloseScreen(true);
            break;
        }
        return;
      }

      // Enter Key Navigation
      if (event.key === 'Enter') {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
          // Don't advance if it's a textarea or if we are in a search result selection
          if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit') return;
          
          const form = target.closest('form') || document.body;
          const focusable = Array.from(form.querySelectorAll('input, select, button, [tabindex]:not([tabindex="-1"])'))
            .filter(el => {
              const style = window.getComputedStyle(el);
              return !el.hasAttribute('disabled') && style.display !== 'none' && style.visibility !== 'hidden';
            }) as HTMLElement[];
          
          const index = focusable.indexOf(target);
          if (index > -1 && index < focusable.length - 1) {
            event.preventDefault();
            focusable[index + 1].focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length, activeSubView, shortcuts, setView, setShowCloseScreen]);
  
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
                            onChange={(e) => setInitialAmount(formatDecimal(parseCurrencyInput(e.target.value)))}
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
        return <ParkedSalesScreen onBack={() => setActiveSubView('checkout')} onLoadSale={handleLoadParkedSale} onFinalizeDelivery={handleFinalizeDelivery} />;
      case 'today':
        return <TodaySalesScreen onBack={() => setActiveSubView('checkout')} onViewReceipt={(sale) => { setLastSale(sale); setReceiptModalOpen(true); }} />;
      case 'checkout':
      default:
        if (isPaymentView) {
          return (
            <main className="flex-grow flex flex-col lg:grid lg:grid-cols-5 gap-4 p-4 overflow-y-auto lg:overflow-hidden">
              <div className="lg:col-span-3 flex flex-col gap-4 lg:overflow-hidden h-auto lg:h-full shrink-0">
                <PaymentView 
                  totalAmount={total}
                  selectedCustomer={selectedCustomer}
                  onCancel={() => setIsPaymentView(false)}
                  onFinalize={handleFinalizeSale}
                />
              </div>
              
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 flex flex-col h-auto shrink-0 mb-8 lg:mb-0">
                <div className="flex-grow space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b dark:border-gray-700">
                    <h2 className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white">Resumo da Venda</h2>
                    <div className="p-2 bg-theme-primary/10 text-theme-primary rounded-lg">
                      <ShoppingCart size={20} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold text-gray-500 uppercase">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                      <div className="flex justify-between text-sm font-bold text-red-500 uppercase">
                        <span>Descontos Totais</span>
                        <span>-{formatCurrency(calculatedDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4 border-t-2 border-dashed dark:border-gray-700">
                      <span className="text-xl font-black uppercase text-gray-800 dark:text-white">Total</span>
                      <span className="text-4xl font-black text-theme-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
                      <UserCircle size={14} />
                      <span>Cliente Selecionado</span>
                    </div>
                    {selectedCustomer ? (
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 dark:text-white">{selectedCustomer.name}</span>
                        <button onClick={() => setSelectedCustomer(null)} className="text-red-500 hover:text-red-600">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Venda para consumidor final</p>
                    )}
                  </div>
                </div>
              </div>
            </main>
          );
        }

        return (
          <main className="flex-grow flex flex-col lg:grid lg:grid-cols-5 gap-4 p-4 overflow-y-auto lg:overflow-hidden">
            <div className="lg:col-span-3 flex flex-col gap-4 lg:overflow-hidden h-auto lg:h-full shrink-0">
              <ProductSearch onSelect={handleProductSelect} />
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
                                className="w-full text-right pl-7 pr-2 py-1.5 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800"
                            />
                        </div>
                    </div>
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
            <Button variant="success" className="w-full text-lg py-3" onClick={() => setIsPaymentView(true)} disabled={isPayButtonDisabled}>
                <DollarSign className="w-6 h-6 mr-2"/> PAGAR ({(shortcuts || []).find(s => s.action === 'FINALIZE_SALE')?.key || 'F12'})
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

      {isReceiptModalOpen && lastSale && (
        <FiscalReceipt 
          isOpen={isReceiptModalOpen} 
          onClose={() => setReceiptModalOpen(false)} 
          sale={lastSale} 
          config={appConfig}
        />
      )}
    </div>
  );
};

export default POSScreen;
