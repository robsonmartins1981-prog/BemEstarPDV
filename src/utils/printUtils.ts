
import { Sale } from '../types';
import { formatCurrency } from './formatUtils';

export const generateReceiptHtml = (sale: Sale, companyName: string, config: any) => {
  const date = new Date(sale.date).toLocaleString('pt-BR');
  const width = config.printerWidth === '58mm' ? '58mm' : '80mm';
  
  return `
    <html>
      <head>
        <style>
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: ${width}; 
            margin: 0; 
            padding: 10px;
            font-size: 12px;
            line-height: 1.2;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .flex { display: flex; justify-content: space-between; }
          .header { margin-bottom: 10px; }
          .footer { margin-top: 10px; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold" style="font-size: 16px;">${companyName}</div>
          <div>RECIBO DE VENDA</div>
          <div>${date}</div>
        </div>
        
        <div class="line"></div>
        
        <table>
          <thead>
            <tr>
              <th>ITEM</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td colspan="2">${item.productName}</td>
              </tr>
              <tr>
                <td>${item.quantity} x ${formatCurrency(item.unitPrice)}</td>
                <td style="text-align: right;">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="line"></div>
        
        <div class="flex">
          <span>SUBTOTAL:</span>
          <span>${formatCurrency(sale.subtotal)}</span>
        </div>
        ${sale.totalDiscount > 0 ? `
          <div class="flex">
            <span>DESCONTO:</span>
            <span>-${formatCurrency(sale.totalDiscount)}</span>
          </div>
        ` : ''}
        <div class="flex bold" style="font-size: 14px; margin-top: 5px;">
          <span>TOTAL:</span>
          <span>${formatCurrency(sale.totalAmount)}</span>
        </div>
        
        <div class="line"></div>
        
        <div class="bold">PAGAMENTOS:</div>
        ${sale.payments.map(p => `
          <div class="flex">
            <span>${p.method}:</span>
            <span>${formatCurrency(p.amount)}</span>
          </div>
        `).join('')}
        ${sale.change > 0 ? `
          <div class="flex">
            <span>TROCO:</span>
            <span>${formatCurrency(sale.change)}</span>
          </div>
        ` : ''}
        
        <div class="line"></div>
        
        <div class="footer center">
          <div>Obrigado pela preferência!</div>
          <div>ID: ${sale.id.substring(0, 8)}</div>
        </div>
      </body>
    </html>
  `;
};

export const printReceipt = async (sale: Sale, config: any) => {
  if (!(window as any).require) {
    console.warn('[Print] Ambiente não-Electron. Simulando impressão.');
    return;
  }

  const { ipcRenderer } = (window as any).require('electron');
  const html = generateReceiptHtml(sale, config.companyName || 'BEM ESTAR PDV', config);
  
  try {
    const result = await ipcRenderer.invoke('print-receipt', html, config.printerName);
    if (!result.success) {
      console.error('[Print] Erro ao imprimir:', result.error);
    }
  } catch (error) {
    console.error('[Print] Erro na comunicação IPC:', error);
  }
};
