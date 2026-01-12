
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Sale } from '../../types';
import Button from '../shared/Button';
import { ReceiptText, Clock, ShoppingBag, CreditCard, ChevronDown, ChevronUp, Search, Calendar, ArrowLeft, MessageCircle, Printer } from 'lucide-react';

interface TodaySalesScreenProps {
  onBack: () => void;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDateTime = (date: Date) => date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const TodaySalesScreen: React.FC<TodaySalesScreenProps> = ({ onBack }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      const allSales = await db.getAll('sales');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySales = allSales
        .filter(sale => new Date(sale.date) >= today)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setSales(todaySales);
    };
    fetchSales();
  }, []);

  const handlePrintReceipt = (sale: Sale) => {
    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;

    const itemsHtml = sale.items.map(item => `
        <tr>
            <td style="padding: 2px 0;">${item.productName.substring(0, 20)}</td>
            <td style="text-align: center;">${item.quantity.toFixed(2)}</td>
            <td style="text-align: right;">${formatCurrency(item.total)}</td>
        </tr>
    `).join('');

    const paymentsHtml = sale.payments.map(p => `
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
            <span>${p.method.toUpperCase()}:</span>
            <span>${formatCurrency(p.amount)}</span>
        </div>
    `).join('');

    printWindow.document.write(`
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
                .header { text-align: center; font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; }
                .total-area { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; font-weight: bold; }
                .payment-area { margin-top: 5px; padding-top: 5px; border-top: 1px solid #eee; }
                @media print { @page { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                BEM ESTAR<br>RECIBO DE VENDA<br>
                <small>${formatDateTime(new Date(sale.date))}</small><br>
                <small>ID: ${sale.id.split('-')[0].toUpperCase()}</small>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="text-align: left;">DESC</th>
                        <th style="text-align: center;">QTD</th>
                        <th style="text-align: right;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div class="total-area">
                <div style="display: flex; justify-content: space-between;">
                    <span>SUBTOTAL:</span>
                    <span>${formatCurrency(sale.subtotal)}</span>
                </div>
                ${sale.totalDiscount > 0 ? `
                <div style="display: flex; justify-content: space-between; color: #666;">
                    <span>DESCONTO:</span>
                    <span>-${formatCurrency(sale.totalDiscount)}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(sale.totalAmount)}</span>
                </div>
            </div>
            <div class="payment-area">
                <strong>PAGAMENTOS:</strong>
                ${paymentsHtml}
                ${sale.change > 0 ? `<div style="display: flex; justify-content: space-between;"><span>TROCO:</span><span>${formatCurrency(sale.change)}</span></div>` : ''}
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 9px;">
                OBRIGADO PELA PREFERÊNCIA!<br>Volte sempre.
            </div>
            <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
        </html>
    `);
    printWindow.document.close();
  };

  const handleShareWhatsApp = async (sale: Sale) => {
    const line = "--------------------------------";
    let text = `*BEM ESTAR - RECIBO* 🧾\n`;
    text += `_${new Date(sale.date).toLocaleString('pt-BR')}_\n`;
    text += `*ID:* ${sale.id.split('-')[0].toUpperCase()}\n`;
    text += `${line}\n`;
    
    text += `*PRODUTOS:*\n`;
    sale.items.forEach(item => {
        text += `• ${item.quantity.toFixed(2)} x ${item.productName.toUpperCase()} = ${formatCurrency(item.total)}\n`;
    });
    
    text += `${line}\n`;
    text += `*SUBTOTAL:* ${formatCurrency(sale.subtotal)}\n`;
    if (sale.totalDiscount > 0) text += `*DESC:* -${formatCurrency(sale.totalDiscount)}\n`;
    text += `*TOTAL: ${formatCurrency(sale.totalAmount)}*\n`;
    text += `${line}\n`;
    
    text += `*PAGAMENTO:*\n`;
    sale.payments.forEach(p => {
        text += `• ${p.method.toUpperCase()}: ${formatCurrency(p.amount)}\n`;
    });
    
    if (sale.change > 0) text += `*TROCO:* ${formatCurrency(sale.change)}\n`;
    
    text += `\n*Agradecemos a preferência!* 🌿`;

    const encodedText = encodeURIComponent(text);
    
    let phone = "";
    if (sale.customerId) {
        const customer = await db.get('customers', sale.customerId);
        if (customer?.cellphone) phone = customer.cellphone.replace(/\D/g, '');
    }

    const whatsappUrl = phone 
        ? `https://wa.me/55${phone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerCPF?.includes(searchTerm) ||
      s.items.some(i => i.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [sales, searchTerm]);

  const dailyTotal = useMemo(() => {
    return filteredSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  }, [filteredSales]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <ReceiptText className="text-theme-primary" /> Vendas do Dia
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mt-1">
                <Calendar size={12} /> {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por item, CPF ou ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-theme-primary/10 p-4 rounded-2xl border border-theme-primary/20">
            <p className="text-[10px] font-bold text-theme-primary uppercase">Faturamento Bruto</p>
            <p className="text-2xl font-black text-theme-primary">{formatCurrency(dailyTotal)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Qtd. Vendas</p>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">{filteredSales.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Ticket Médio</p>
            <p className="text-2xl font-black text-gray-800 dark:text-gray-100">
              {filteredSales.length > 0 ? formatCurrency(dailyTotal / filteredSales.length) : 'R$ 0,00'}
            </p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {filteredSales.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <ShoppingBag size={64} className="mx-auto mb-4 opacity-10" />
              <p className="text-lg font-medium">Nenhuma venda registrada até o momento.</p>
            </div>
          ) : (
            filteredSales.map(sale => (
              <div 
                key={sale.id} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md"
              >
                <button 
                  onClick={() => setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-5 text-left">
                    <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-xl text-theme-primary">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="font-black text-gray-800 dark:text-gray-100 text-lg leading-tight">{formatTime(new Date(sale.date))}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {sale.items.length} ITENS {sale.customerCPF ? `• CPF: ${sale.customerCPF}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-black text-xl text-theme-primary">{formatCurrency(sale.totalAmount)}</p>
                      <span className="text-[9px] text-gray-400 uppercase font-bold">ID: {sale.id.split('-')[0]}</span>
                    </div>
                    {expandedSaleId === sale.id ? <ChevronUp size={24} className="text-gray-400" /> : <ChevronDown size={24} className="text-gray-400" />}
                  </div>
                </button>

                {expandedSaleId === sale.id && (
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Detalhamento dos Itens</p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handlePrintReceipt(sale)}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold rounded transition-colors"
                            >
                                <Printer size={12} /> IMPRIMIR
                            </button>
                            <button 
                                onClick={() => handleShareWhatsApp(sale)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded transition-colors"
                            >
                                <MessageCircle size={12} /> WHATSAPP
                            </button>
                        </div>
                      </div>
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                          <div className="flex gap-2">
                            <span className="font-bold text-theme-primary">{item.quantity}x</span>
                            <span className="text-gray-700 dark:text-gray-300">{item.productName}</span>
                          </div>
                          <span className="font-mono font-bold">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t dark:border-gray-700 flex flex-wrap gap-2">
                      {sale.payments.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary text-white rounded-lg text-xs font-bold shadow-sm">
                          <CreditCard size={14} />
                          <span className="uppercase">{p.method}</span>
                          <span className="bg-white/20 px-1.5 py-0.5 rounded">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                      {sale.change > 0 && (
                        <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                          TROCO: {formatCurrency(sale.change)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t dark:border-gray-800 flex justify-end shrink-0">
            <Button variant="secondary" onClick={onBack}>
              <ArrowLeft size={18} className="mr-2" /> Voltar ao Caixa
            </Button>
        </div>
      </div>
    </div>
  );
};

export default TodaySalesScreen;
