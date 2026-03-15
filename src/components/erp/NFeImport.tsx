
import React, { useState, useRef } from 'react';
import { FileCode, Upload, CheckCircle2, AlertCircle, ArrowRight, Package, Truck, DollarSign, Calendar } from 'lucide-react';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { NFeData, NFeItem, Product, Supplier, Expense } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const NFeImport: React.FC = () => {
  const [nfeData, setNfeData] = useState<NFeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [importStep, setImportStep] = useState<'UPLOAD' | 'REVIEW'>('UPLOAD');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseXML(file);
  };

  const parseXML = (file: File) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");

        // Basic NFe Parsing
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        const supplier = {
          cnpj: emit?.getElementsByTagName('CNPJ')[0]?.textContent || '',
          name: emit?.getElementsByTagName('xNome')[0]?.textContent || '',
        };

        const detList = xmlDoc.getElementsByTagName('det');
        const items: NFeItem[] = [];
        for (let i = 0; i < detList.length; i++) {
          const prod = detList[i].getElementsByTagName('prod')[0];
          items.push({
            code: prod.getElementsByTagName('cProd')[0]?.textContent || '',
            name: prod.getElementsByTagName('xProd')[0]?.textContent || '',
            ncm: prod.getElementsByTagName('NCM')[0]?.textContent || '',
            quantity: parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '0'),
            unitPrice: parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0'),
            totalPrice: parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || '0'),
            status: 'NEW',
            expirationDate: '',
            conversionFactor: 1
          });
        }

        const totalAmount = parseFloat(xmlDoc.getElementsByTagName('vNF')[0]?.textContent || '0');
        const issueDate = new Date(xmlDoc.getElementsByTagName('dhEmi')[0]?.textContent || new Date());

        // Parse Duplicatas (Accounts Payable)
        const duplicatas: any[] = [];
        const dupList = xmlDoc.getElementsByTagName('dup');
        for (let i = 0; i < dupList.length; i++) {
          duplicatas.push({
            number: dupList[i].getElementsByTagName('nDup')[0]?.textContent || '',
            dueDate: new Date(dupList[i].getElementsByTagName('dVenc')[0]?.textContent || new Date()),
            amount: parseFloat(dupList[i].getElementsByTagName('vDup')[0]?.textContent || '0')
          });
        }

        setNfeData({ supplier, items, totalAmount, issueDate, duplicatas } as any);
        setImportStep('REVIEW');
      } catch (err) {
        setError('Erro ao processar o arquivo XML. Verifique se é uma NF-e válida.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!nfeData) return;
    setLoading(true);
    try {
      // 1. Ensure Supplier exists
      let supplier = (await db.getAll('suppliers')).find(s => s.cnpj === nfeData.supplier.cnpj);
      if (!supplier) {
        supplier = {
          id: uuidv4(),
          name: nfeData.supplier.name,
          cnpj: nfeData.supplier.cnpj
        };
        await db.put('suppliers', supplier);
      }

      // 2. Create Products and Update Stock (Simplified for now)
      for (const item of nfeData.items) {
        let product = (await db.getAll('products')).find(p => p.barcode === item.code || p.name === item.name);
        if (!product) {
          product = {
            id: uuidv4(),
            name: item.name,
            barcode: item.code,
            price: item.unitPrice * 1.5, // Default 50% markup
            costPrice: item.unitPrice,
            stock: item.quantity,
            isBulk: false,
            categoryId: 'default'
          };
          await db.put('products', product);
        } else {
          product.stock += item.quantity;
          product.costPrice = item.unitPrice;
          await db.put('products', product);
        }
      }

      // 3. Create Accounts Payable (Expenses)
      const duplicatas = (nfeData as any).duplicatas || [];
      if (duplicatas.length > 0) {
        for (const dup of duplicatas) {
          const expense: Expense = {
            id: uuidv4(),
            description: `NF-e ${dup.number} - ${nfeData.supplier.name}`,
            amount: dup.amount,
            dueDate: dup.dueDate,
            status: 'PENDING',
            supplierId: supplier.id
          };
          await db.put('expenses', expense);
        }
      } else {
        // Create a single account for the total if no installments found
        const expense: Expense = {
          id: uuidv4(),
          description: `NF-e Total - ${nfeData.supplier.name}`,
          amount: nfeData.totalAmount,
          dueDate: nfeData.issueDate,
          status: 'PENDING',
          supplierId: supplier.id
        };
        await db.put('expenses', expense);
      }

      setSuccess(true);
    } catch (err) {
      setError('Erro ao importar os dados da nota fiscal.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-3xl mb-6 inline-block">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white mb-2">Importação Concluída!</h2>
        <p className="text-gray-400 font-medium mb-8">Produtos cadastrados, estoque atualizado e contas a pagar geradas com sucesso.</p>
        <Button onClick={() => { setSuccess(false); setImportStep('UPLOAD'); setNfeData(null); }}>
          Importar Outra Nota
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      {importStep === 'UPLOAD' ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-theme-primary/10 p-6 rounded-3xl mb-6">
            <FileCode className="w-16 h-16 text-theme-primary" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white mb-2">Importar NF-e XML</h2>
          <p className="text-gray-400 font-medium max-w-md mb-8">Arraste o arquivo XML da nota fiscal para cadastrar produtos e gerar contas a pagar automaticamente.</p>
          
          <input 
            type="file" 
            accept=".xml" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-lg p-12 border-4 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center hover:border-theme-primary transition-all cursor-pointer group"
          >
            <Upload className="w-12 h-12 text-gray-300 mb-4 group-hover:text-theme-primary transition-all" />
            <p className="text-sm font-black uppercase tracking-widest text-gray-400 group-hover:text-theme-primary transition-all">
              {loading ? 'Processando...' : 'Clique ou arraste o XML aqui'}
            </p>
          </div>
          {error && (
            <div className="mt-6 flex items-center gap-2 text-red-500 font-bold">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Revisar Importação</h2>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setImportStep('UPLOAD')}>Cancelar</Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? 'Importando...' : 'Confirmar Importação'} <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="text-theme-primary" size={20} />
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest">Fornecedor</h3>
              </div>
              <p className="font-bold text-gray-800 dark:text-white uppercase">{nfeData?.supplier.name}</p>
              <p className="text-xs text-gray-500">CNPJ: {nfeData?.supplier.cnpj}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-blue-500" size={20} />
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest">Itens</h3>
              </div>
              <p className="font-bold text-gray-800 dark:text-white">{nfeData?.items.length} Produtos</p>
              <p className="text-xs text-gray-500">Total: R$ {nfeData?.totalAmount.toFixed(2)}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="text-emerald-500" size={20} />
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest">Contas a Pagar</h3>
              </div>
              <p className="font-bold text-gray-800 dark:text-white">
                {(nfeData as any)?.duplicatas.length || 1} Parcelas
              </p>
              <p className="text-xs text-gray-500">Vencimento: {nfeData?.issueDate.toLocaleDateString()}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qtd</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Preço Un.</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {nfeData?.items.map((item, idx) => (
                  <tr key={idx} className="border-b dark:border-gray-700">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800 dark:text-white uppercase">{item.name}</p>
                      <p className="text-[10px] text-gray-400">Cód: {item.code}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">R$ {item.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-sm font-black text-gray-800 dark:text-white">R$ {item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFeImport;
