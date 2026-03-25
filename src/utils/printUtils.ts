
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

export const generateFiscalReceiptHtml = (sale: Sale, companyName: string, config: any) => {
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
            font-size: 10px;
            line-height: 1.2;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 5px 0; }
          .flex { display: flex; justify-content: space-between; }
          .header { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .footer { margin-top: 10px; font-size: 8px; border-top: 1px dashed #000; padding-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 5px 0; }
          th { text-align: left; border-bottom: 1px solid #000; }
          .qr-code { border: 1px solid #000; padding: 10px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header center">
          <div class="bold" style="font-size: 14px;">${companyName}</div>
          <div class="bold">Hortifruti & Mercearia</div>
          <div>CNPJ: 12.345.678/0001-90</div>
          <div>Rua das Palmeiras, 123 - Centro</div>
          <div>Curitiba - PR - CEP: 80000-000</div>
        </div>
        
        <div class="center">
          <div class="bold">DANFE NFC-e</div>
          <div>Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</div>
        </div>
        
        <div class="line"></div>
        
        <table>
          <thead>
            <tr>
              <th>ITEM</th>
              <th style="text-align: center;">QTD</th>
              <th style="text-align: right;">V.UN</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items.map(item => `
              <tr>
                <td colspan="4" class="bold">${item.productName}</td>
              </tr>
              <tr>
                <td>${item.productId.slice(0, 8)}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.unitPrice).replace('R$', '')}</td>
                <td style="text-align: right;">${formatCurrency(item.total).replace('R$', '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="line"></div>
        
        <div class="flex">
          <span>QTD. TOTAL DE ITENS:</span>
          <span class="bold">${sale.items.length}</span>
        </div>
        <div class="flex">
          <span>VALOR TOTAL R$:</span>
          <span class="bold">${formatCurrency(sale.subtotal).replace('R$', '')}</span>
        </div>
        ${sale.totalDiscount > 0 ? `
          <div class="flex">
            <span>DESCONTOS R$:</span>
            <span class="bold">-${formatCurrency(sale.totalDiscount).replace('R$', '')}</span>
          </div>
        ` : ''}
        <div class="flex bold" style="font-size: 12px; margin-top: 5px;">
          <span>VALOR A PAGAR R$:</span>
          <span>${formatCurrency(sale.totalAmount).replace('R$', '')}</span>
        </div>
        
        <div class="line"></div>
        
        <div class="bold">FORMA DE PAGAMENTO:</div>
        ${sale.payments.map(p => `
          <div class="flex">
            <span>${p.method}:</span>
            <span class="bold">${formatCurrency(p.amount).replace('R$', '')}</span>
          </div>
        `).join('')}
        ${sale.change > 0 ? `
          <div class="flex">
            <span>TROCO R$:</span>
            <span class="bold">${formatCurrency(sale.change).replace('R$', '')}</span>
          </div>
        ` : ''}
        
        <div class="line"></div>
        
        <div class="center">
          <div class="bold">Consulte pela Chave de Acesso em:</div>
          <div style="font-size: 8px;">http://www.fazenda.pr.gov.br/nfce/consulta</div>
          <div class="bold" style="font-size: 9px; margin-top: 5px;">
            4126 0312 3456 7800 0190 6500 1000 0001 2310 0000 0001
          </div>
        </div>
        
        <div class="center">
          <div class="qr-code">
            [ QR CODE NFC-e ]
          </div>
          <div style="font-size: 8px;">
            <div class="bold">CONSUMIDOR: ${sale.customerCPF || 'NÃO IDENTIFICADO'}</div>
            <div>NFC-e nº ${sale.id.slice(0, 6).toUpperCase()} Série 001</div>
            <div>${date}</div>
            <div>Protocolo: 141260001234567</div>
          </div>
        </div>
        
        <div class="footer center">
          <div class="bold italic">Obrigado pela preferência!</div>
          <div>ID: ${sale.id}</div>
        </div>
      </body>
    </html>
  `;
};

export const printReceipt = async (sale: Sale, config: any, isFiscal: boolean = false) => {
  const html = isFiscal 
    ? generateFiscalReceiptHtml(sale, config.companyName || 'BEM ESTAR PDV', config)
    : generateReceiptHtml(sale, config.companyName || 'BEM ESTAR PDV', config);

  if (!(window as any).require) {
    console.warn('[Print] Ambiente não-Electron. Usando diálogo do sistema.');
    
    // Fallback para navegador: Abre uma janela temporária e imprime
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      alert('Por favor, permita pop-ups para imprimir o recibo.');
    }
    return;
  }

  const { ipcRenderer } = (window as any).require('electron');
  
  try {
    const result = await ipcRenderer.invoke('print-receipt', html, config.printerName);
    if (!result.success) {
      console.error('[Print] Erro ao imprimir:', result.error);
    }
  } catch (error) {
    console.error('[Print] Erro na comunicação IPC:', error);
  }
};
