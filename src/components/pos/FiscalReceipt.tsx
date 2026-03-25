import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { Sale, AppConfig } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { printReceipt } from '../../utils/printUtils';
import { Printer, Download, Share2, CheckCircle2 } from 'lucide-react';

interface FiscalReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  config: AppConfig;
}

const FiscalReceipt: React.FC<FiscalReceiptProps> = ({ isOpen, onClose, sale, config }) => {
  const handlePrint = async () => {
    await printReceipt(sale, config, true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cupom Fiscal Eletrônico"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Fechar</Button>
          <Button variant="primary" className="flex-1" onClick={handlePrint}>
            <Printer size={18} className="mr-2" /> Imprimir
          </Button>
        </div>
      }
    >
      <div className="bg-[#fdfdfd] p-6 rounded-sm border border-gray-200 shadow-sm max-w-[300px] mx-auto font-mono text-[9px] text-black leading-[1.2] print:shadow-none print:border-none print:p-0 print:max-w-full">
        <div className="text-center space-y-0.5 mb-4 border-b border-dashed border-gray-300 pb-2">
          <p className="font-black text-[11px] uppercase">BEM ESTAR</p>
          <p className="font-bold uppercase">Hortifruti & Mercearia</p>
          <p>CNPJ: 12.345.678/0001-90</p>
          <p>Rua das Palmeiras, 123 - Centro</p>
          <p>Curitiba - PR - CEP: 80000-000</p>
          <p>IE: 123456789 - IM: 987654321</p>
        </div>

        <div className="text-center mb-4">
          <p className="font-bold uppercase text-[10px]">DANFE NFC-e</p>
          <p className="uppercase">Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
        </div>

        <div className="border-b border-dashed border-gray-300 mb-2 pb-1">
          <div className="flex justify-between font-bold uppercase mb-1 border-b border-gray-200 pb-1">
            <span className="w-[45%]">Descrição</span>
            <span className="w-[15%] text-center">Qtd</span>
            <span className="w-[20%] text-right">V.Un</span>
            <span className="w-[20%] text-right">V.Tot</span>
          </div>
          <div className="space-y-1">
            {sale.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <span className="w-[45%] leading-tight uppercase">{item.productName}</span>
                <span className="w-[15%] text-center">{item.quantity}</span>
                <span className="w-[20%] text-right">{formatCurrency(item.unitPrice).replace('R$', '').trim()}</span>
                <span className="w-[20%] text-right">{formatCurrency(item.total).replace('R$', '').trim()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span>QTD. TOTAL DE ITENS</span>
            <span className="font-bold">{sale.items.length}</span>
          </div>
          <div className="flex justify-between">
            <span>VALOR TOTAL R$</span>
            <span className="font-bold">{formatCurrency(sale.subtotal).replace('R$', '').trim()}</span>
          </div>
          {sale.totalDiscount > 0 && (
            <div className="flex justify-between">
              <span>DESCONTOS R$</span>
              <span className="font-bold">-{formatCurrency(sale.totalDiscount).replace('R$', '').trim()}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-[11px] border-t border-gray-200 pt-1">
            <span>VALOR A PAGAR R$</span>
            <span>{formatCurrency(sale.totalAmount).replace('R$', '').trim()}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-300 mb-4 pb-2 space-y-1">
          <p className="font-bold uppercase mb-1">FORMA DE PAGAMENTO:</p>
          {sale.payments.map((p, index) => (
            <div key={index} className="flex justify-between">
              <span className="uppercase">{p.method}</span>
              <span className="font-bold">{formatCurrency(p.amount).replace('R$', '').trim()}</span>
            </div>
          ))}
          {sale.change > 0 && (
            <div className="flex justify-between">
              <span>TROCO R$</span>
              <span className="font-bold">{formatCurrency(sale.change).replace('R$', '').trim()}</span>
            </div>
          )}
        </div>

        <div className="text-center space-y-1 mb-4">
          <p className="font-bold uppercase">Consulte pela Chave de Acesso em:</p>
          <p className="text-[7px] break-all">http://www.fazenda.pr.gov.br/nfce/consulta</p>
          <p className="font-bold text-[8px] mt-1">4126 0312 3456 7800 0190 6500 1000 0001 2310 0000 0001</p>
        </div>

        <div className="border-t border-dashed border-gray-300 pt-4 text-center space-y-2">
          <div className="bg-white p-2 inline-block border border-gray-200">
             <div className="w-28 h-28 bg-gray-100 flex items-center justify-center text-[7px] text-gray-400 border border-dashed border-gray-300">
               [ QR CODE NFC-e ]
             </div>
          </div>
          <div className="text-[7px] space-y-0.5">
            <p className="font-bold uppercase">CONSUMIDOR: {sale.customerCPF ? sale.customerCPF : 'CONSUMIDOR NÃO IDENTIFICADO'}</p>
            <p>NFC-e nº {sale.id.slice(0, 6).toUpperCase()} Série 001 {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString()}</p>
            <p>Protocolo de Autorização: 141260001234567</p>
          </div>
          <p className="text-[8px] italic font-bold mt-2">Obrigado pela preferência!</p>
        </div>
      </div>
    </Modal>
  );
};

export default FiscalReceipt;
