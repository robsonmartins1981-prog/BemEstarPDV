
import React, { useState, useRef, useEffect } from 'react';
import { FileCode, Upload, CheckCircle2, AlertCircle, ArrowRight, Package, Truck, DollarSign, Calendar, Search, Link as LinkIcon, Plus, X, Settings2 } from 'lucide-react';
import Button from '../shared/Button';
import ProductSearchModal from '../shared/ProductSearchModal';
import { formatCurrency, formatQuantity } from '../../utils/formatUtils';
import { db } from '../../services/databaseService';
import type { NFeData, NFeItem, Product, Supplier, Expense, InventoryLot, StockMovement } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const NFeImport: React.FC = () => {
  const [nfeData, setNfeData] = useState<NFeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [importStep, setImportStep] = useState<'UPLOAD' | 'REVIEW'>('UPLOAD');
  const [linkingItemIdx, setLinkingItemIdx] = useState<number | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    xmlProduct: true,
    linkProduct: true,
    quantity: true,
    lot: true,
    unitCost: true,
    profit: true,
    sellingPrice: true,
    ncm: false,
    cfop: false,
    uCom: false,
    discount: false,
    otherExpenses: false,
    freight: false,
    insurance: false,
    totalPrice: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseXML(file);
  };

  const parseXML = (file: File) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
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
        const allProducts = await db.getAll('products');

        for (let i = 0; i < detList.length; i++) {
          const prod = detList[i].getElementsByTagName('prod')[0];
          const code = prod.getElementsByTagName('cProd')[0]?.textContent || '';
          const name = prod.getElementsByTagName('xProd')[0]?.textContent || '';
          
          // Try to auto-link
          const existingProduct = allProducts.find(p => p.barcode === code || p.name.toLowerCase() === name.toLowerCase());
          
          const unitPrice = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');
          const conversionFactor = existingProduct?.purchaseConversionFactor || 1;
          const costPrice = unitPrice / conversionFactor;
          
          // Default selling price and margin
          let profitMargin = 100;
          let sellingPrice = costPrice * (1 + profitMargin / 100);

          if (existingProduct) {
            sellingPrice = existingProduct.price;
            profitMargin = costPrice > 0 ? ((sellingPrice - costPrice) / costPrice) * 100 : 0;
          }

          items.push({
            code,
            name,
            ncm: prod.getElementsByTagName('NCM')[0]?.textContent || '',
            cfop: prod.getElementsByTagName('CFOP')[0]?.textContent || '',
            uCom: prod.getElementsByTagName('uCom')[0]?.textContent || '',
            quantity: parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '0'),
            unitPrice,
            totalPrice: parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || '0'),
            discount: parseFloat(prod.getElementsByTagName('vDesc')[0]?.textContent || '0'),
            otherExpenses: parseFloat(prod.getElementsByTagName('vOutro')[0]?.textContent || '0'),
            freight: parseFloat(prod.getElementsByTagName('vFrete')[0]?.textContent || '0'),
            insurance: parseFloat(prod.getElementsByTagName('vSeg')[0]?.textContent || '0'),
            status: existingProduct ? 'LINKED' : 'NEW',
            linkedProductDetails: existingProduct,
            expirationDate: '',
            lotNumber: '',
            conversionFactor,
            sellingPrice,
            profitMargin
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

  const handleLinkProduct = (idx: number, product: Product | null) => {
    if (!nfeData) return;
    const newItems = [...nfeData.items];
    const item = newItems[idx];
    
    let sellingPrice = item.sellingPrice;
    let profitMargin = item.profitMargin;
    let conversionFactor = item.conversionFactor;

    if (product) {
      sellingPrice = product.price;
      conversionFactor = product.purchaseConversionFactor || 1;
      const costPrice = item.unitPrice / conversionFactor;
      profitMargin = costPrice > 0 ? ((sellingPrice - costPrice) / costPrice) * 100 : 0;
    }

    newItems[idx] = {
      ...item,
      status: product ? 'LINKED' : 'NEW',
      linkedProductDetails: product || undefined,
      sellingPrice,
      profitMargin,
      conversionFactor
    };
    setNfeData({ ...nfeData, items: newItems });
    setLinkingItemIdx(null);
  };

  const updateItemField = (idx: number, field: keyof NFeItem, value: any) => {
    if (!nfeData) return;
    const newItems = [...nfeData.items];
    const item = { ...newItems[idx], [field]: value };
    
    const costPrice = item.unitPrice / item.conversionFactor;

    if (field === 'sellingPrice') {
      const newSellingPrice = parseFloat(value) || 0;
      item.profitMargin = costPrice > 0 ? ((newSellingPrice - costPrice) / costPrice) * 100 : 0;
    } else if (field === 'profitMargin') {
      const newMargin = parseFloat(value) || 0;
      item.sellingPrice = costPrice * (1 + newMargin / 100);
    } else if (field === 'conversionFactor' || field === 'unitPrice') {
      // Recalculate margin based on current selling price if cost changes
      const newCostPrice = item.unitPrice / item.conversionFactor;
      item.profitMargin = newCostPrice > 0 ? (((item.sellingPrice || 0) - newCostPrice) / newCostPrice) * 100 : 0;
    }

    newItems[idx] = item;
    setNfeData({ ...nfeData, items: newItems });
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

      // 2. Process Items
      for (const item of nfeData.items) {
        let product: Product;
        const sellingPrice = parseFloat(item.sellingPrice as any) || 0;
        const conversionFactor = parseFloat(item.conversionFactor as any) || 1;
        const unitPrice = parseFloat(item.unitPrice as any) || 0;
        const quantity = parseFloat(item.quantity as any) || 0;
        
        if (item.status === 'LINKED' && item.linkedProductDetails) {
          product = item.linkedProductDetails;
          product.stock += quantity * conversionFactor;
          product.costPrice = unitPrice / conversionFactor;
          product.price = sellingPrice || product.price;
          product.purchaseConversionFactor = conversionFactor;
          await db.put('products', product);
        } else {
          product = {
            id: uuidv4(),
            name: item.name,
            barcode: item.code,
            price: sellingPrice || (unitPrice / conversionFactor) * 1.5,
            costPrice: unitPrice / conversionFactor,
            stock: quantity * conversionFactor,
            unitType: 'UN',
            isBulk: false,
            categoryId: 'default',
            supplierId: supplier.id,
            purchaseConversionFactor: conversionFactor
          };
          await db.put('products', product);
        }

        // 3. Create Inventory Lot if expiration date or lot number is provided
        if (item.expirationDate || item.lotNumber) {
          const lot: InventoryLot = {
            id: uuidv4(),
            productId: product.id,
            supplierId: supplier.id,
            lotNumber: item.lotNumber,
            quantity: quantity * conversionFactor,
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
            entryDate: new Date(),
            costPrice: unitPrice / conversionFactor
          };
          await db.put('inventoryLots', lot);
        }

        // 4. Create Stock Movement
        const movement: StockMovement = {
          id: uuidv4(),
          productId: product.id,
          quantity: quantity * conversionFactor,
          type: 'IN',
          reason: `Importação NF-e - ${nfeData.supplier.name}`,
          date: new Date()
        };
        await db.put('stockMovements', movement);
      }

      // 5. Create Accounts Payable (Expenses)
      const duplicatas = (nfeData as any).duplicatas || [];
      if (duplicatas.length > 0) {
        for (const dup of duplicatas) {
          const expense: Expense = {
            id: uuidv4(),
            description: `NF-e ${dup.number} - ${nfeData.supplier.name}`,
            amount: dup.amount,
            dueDate: dup.dueDate,
            purchaseDate: nfeData.issueDate,
            status: 'PENDING',
            supplierId: supplier.id
          };
          await db.put('expenses', expense);
        }
      } else {
        const expense: Expense = {
          id: uuidv4(),
          description: `NF-e Total - ${nfeData.supplier.name}`,
          amount: nfeData.totalAmount,
          dueDate: nfeData.issueDate,
          purchaseDate: nfeData.issueDate,
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
              <p className="text-xs text-gray-500">Total: {formatCurrency(nfeData?.totalAmount)}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="text-emerald-500" size={20} />
                <h3 className="font-black uppercase text-xs text-gray-400 tracking-widest">Contas a Pagar</h3>
              </div>
              <p className="font-bold text-gray-800 dark:text-white">
                {(nfeData as any)?.duplicatas.length || 1} Parcelas
              </p>
              <p className="text-xs text-gray-500">Vencimento: {nfeData?.issueDate.toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Itens da Nota</h3>
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-theme-primary transition-all">
                <Settings2 size={14} />
                Colunas
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-4 z-50 hidden group-hover:block">
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-3">Exibir Colunas</h4>
                <div className="space-y-2">
                  {Object.entries(visibleColumns).map(([key, isVisible]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer group/item">
                      <input 
                        type="checkbox" 
                        checked={isVisible} 
                        onChange={() => toggleColumn(key)}
                        className="rounded border-gray-300 text-theme-primary focus:ring-theme-primary"
                      />
                      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase group-hover/item:text-theme-primary transition-all">
                        {key === 'xmlProduct' ? 'Produto XML' :
                         key === 'linkProduct' ? 'Vincular' :
                         key === 'quantity' ? 'Qtd / Fator' :
                         key === 'lot' ? 'Lote / Validade' :
                         key === 'unitCost' ? 'Custo Un.' :
                         key === 'profit' ? 'Lucro (%)' :
                         key === 'sellingPrice' ? 'Venda Un.' :
                         key === 'ncm' ? 'NCM' :
                         key === 'cfop' ? 'CFOP' :
                         key === 'uCom' ? 'Unidade' :
                         key === 'discount' ? 'Desconto' :
                         key === 'otherExpenses' ? 'Outras Desp.' :
                         key === 'freight' ? 'Frete' :
                         key === 'insurance' ? 'Seguro' :
                         key === 'totalPrice' ? 'Total Item' : key}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                    {visibleColumns.xmlProduct && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto XML</th>}
                    {visibleColumns.linkProduct && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vincular Produto</th>}
                    {visibleColumns.uCom && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Unidade</th>}
                    {visibleColumns.ncm && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">NCM</th>}
                    {visibleColumns.cfop && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">CFOP</th>}
                    {visibleColumns.quantity && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qtd / Fator</th>}
                    {visibleColumns.lot && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lote / Validade</th>}
                    {visibleColumns.unitCost && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Custo Un.</th>}
                    {visibleColumns.discount && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Desconto</th>}
                    {visibleColumns.freight && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Frete</th>}
                    {visibleColumns.insurance && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Seguro</th>}
                    {visibleColumns.otherExpenses && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Outras Desp.</th>}
                    {visibleColumns.totalPrice && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Item</th>}
                    {visibleColumns.profit && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Lucro (%)</th>}
                    {visibleColumns.sellingPrice && <th className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Venda Un.</th>}
                  </tr>
                </thead>
                <tbody>
                  {nfeData?.items.map((item, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                      {visibleColumns.xmlProduct && (
                        <td className="px-6 py-2">
                          <p className="text-sm font-bold text-gray-800 dark:text-white uppercase" title={item.name}>{item.name}</p>
                          <p className="text-[10px] text-gray-400">Cód: {item.code}</p>
                        </td>
                      )}
                      {visibleColumns.linkProduct && (
                        <td className="px-6 py-2">
                          <button 
                            onClick={() => setLinkingItemIdx(idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${item.status === 'LINKED' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-theme-primary hover:text-theme-primary'}`}
                          >
                            {item.status === 'LINKED' ? (
                              <>
                                <CheckCircle2 size={14} />
                                <span className="truncate max-w-[120px]">{item.linkedProductDetails?.name}</span>
                              </>
                            ) : (
                              <>
                                <LinkIcon size={14} />
                                <span>Vincular</span>
                              </>
                            )}
                          </button>
                        </td>
                      )}
                      {visibleColumns.uCom && <td className="px-6 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{item.uCom}</td>}
                      {visibleColumns.ncm && <td className="px-6 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{item.ncm}</td>}
                      {visibleColumns.cfop && <td className="px-6 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">{item.cfop}</td>}
                      {visibleColumns.quantity && (
                        <td className="px-6 py-2">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.quantity}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Qtd XML</span>
                            </div>
                                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-0.5" title="Fator de Multiplicação (Ex: 12 unidades por caixa)">
                              <span className="text-[10px] text-gray-400 font-bold">x</span>
                              <input 
                                type="number" 
                                step="0.5"
                                className="w-10 bg-transparent border-none outline-none text-[10px] font-bold text-center focus:text-theme-primary"
                                value={item.conversionFactor}
                                onChange={(e) => updateItemField(idx, 'conversionFactor', parseFloat(e.target.value) || 1)}
                              />
                            </div>
                            <div className="mt-1 px-2 py-0.5 bg-theme-primary/10 rounded text-[9px] font-black text-theme-primary uppercase">
                              = {formatQuantity(item.quantity * item.conversionFactor)} UN
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.lot && (
                        <td className="px-6 py-2">
                          <div className="flex flex-col gap-1">
                            <input 
                              type="text" 
                              placeholder="Lote"
                              className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:border-theme-primary"
                              value={item.lotNumber || ''}
                              onChange={(e) => updateItemField(idx, 'lotNumber', e.target.value)}
                            />
                            <input 
                              type="date" 
                              className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:border-theme-primary"
                              value={item.expirationDate}
                              onChange={(e) => updateItemField(idx, 'expirationDate', e.target.value)}
                            />
                          </div>
                        </td>
                      )}
                      {visibleColumns.unitCost && (
                        <td className="px-6 py-2 text-right">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatCurrency(item.unitPrice)}</p>
                          <p className="text-[10px] font-black text-gray-800 dark:text-white">Custo: {formatCurrency(item.unitPrice / item.conversionFactor)}</p>
                        </td>
                      )}
                      {visibleColumns.discount && <td className="px-6 py-2 text-right text-xs font-bold text-red-500">{formatCurrency(item.discount)}</td>}
                      {visibleColumns.freight && <td className="px-6 py-2 text-right text-xs font-bold text-blue-500">{formatCurrency(item.freight)}</td>}
                      {visibleColumns.insurance && <td className="px-6 py-2 text-right text-xs font-bold text-emerald-500">{formatCurrency(item.insurance)}</td>}
                      {visibleColumns.otherExpenses && <td className="px-6 py-2 text-right text-xs font-bold text-gray-500">{formatCurrency(item.otherExpenses)}</td>}
                      {visibleColumns.totalPrice && <td className="px-6 py-2 text-right text-xs font-bold text-gray-800 dark:text-white">{formatCurrency(item.totalPrice)}</td>}
                      {visibleColumns.profit && (
                        <td className="px-6 py-2 text-center">
                          <div className="flex items-center justify-center gap-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-1 w-20 mx-auto">
                            <input 
                              type="number" 
                              className="w-full bg-transparent border-none outline-none text-xs font-bold text-center"
                              value={typeof item.profitMargin === 'number' ? Math.round(item.profitMargin) : item.profitMargin}
                              onChange={(e) => updateItemField(idx, 'profitMargin', e.target.value)}
                            />
                            <span className="text-[10px] text-gray-400 font-bold">%</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.sellingPrice && (
                        <td className="px-6 py-2 text-right">
                          <div className="flex items-center justify-end gap-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-1 w-24 ml-auto">
                            <span className="text-[10px] text-gray-400 font-bold">R$</span>
                            <input 
                              type="number" 
                              step="0.01"
                              className="w-full bg-transparent border-none outline-none text-xs font-bold text-right"
                              value={typeof item.sellingPrice === 'number' ? item.sellingPrice.toFixed(2) : item.sellingPrice}
                              onChange={(e) => updateItemField(idx, 'sellingPrice', e.target.value)}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ProductSearchModal 
        isOpen={linkingItemIdx !== null}
        onClose={() => setLinkingItemIdx(null)}
        onSelect={(product) => linkingItemIdx !== null && handleLinkProduct(linkingItemIdx, product)}
        title="Vincular Produto da Nota"
      />
    </div>
  );
};

export default NFeImport;
