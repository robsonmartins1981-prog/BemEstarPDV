
import React, { useState, useRef } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Table, FileSpreadsheet, File as FileIcon, ArrowRight, Settings2, Database } from 'lucide-react';
import Button from '../shared/Button';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ProductImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'success';

interface ColumnMapping {
    [key: string]: string; // systemField: fileHeader
}

const SYSTEM_FIELDS = [
    { key: 'id', label: 'Código Interno (ID)', required: false },
    { key: 'barcode', label: 'Código de Barras (EAN)', required: false },
    { key: 'name', label: 'Nome do Produto', required: true },
    { key: 'brand', label: 'Marca', required: false },
    { key: 'price', label: 'Preço de Venda', required: true },
    { key: 'costPrice', label: 'Preço de Custo', required: false },
    { key: 'unitType', label: 'Unidade (UN/KG)', required: false },
    { key: 'categoryName', label: 'Categoria', required: false },
    { key: 'stock', label: 'Estoque Inicial', required: false },
    { key: 'purchaseConversionFactor', label: 'Fator de Conversão', required: false },
];

const ProductImportModal: React.FC<ProductImportModalProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<ImportStep>('upload');
    const [fileData, setFileData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({});
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus({ type: 'loading', message: 'Lendo arquivo...' });

        try {
            if (file.name.endsWith('.pdf')) {
                await handlePdfUpload(file);
            } else {
                await handleExcelCsvUpload(file);
            }
        } catch (error) {
            console.error("Erro ao ler arquivo:", error);
            setStatus({ type: 'error', message: 'Erro ao ler arquivo. Verifique se o formato é válido.' });
        }
    };

    const handleExcelCsvUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (json.length > 0) {
                const fileHeaders = (json[0] as any[]).map(h => String(h || ''));
                const rows = json.slice(1).map((row: any) => {
                    const obj: any = {};
                    fileHeaders.forEach((h, i) => {
                        obj[h] = row[i];
                    });
                    return obj;
                });

                setHeaders(fileHeaders);
                setFileData(rows);
                autoMap(fileHeaders);
                setStep('mapping');
                setStatus({ type: 'idle', message: '' });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handlePdfUpload = async (file: File) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
        }

        // Extremely basic PDF table parsing (split by lines and spaces)
        // This is very fragile but better than nothing for "PDF support"
        const lines = fullText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            // Assume first line might be headers or just data
            const rows = lines.map(line => {
                const parts = line.split(/\s{2,}/); // Split by 2 or more spaces
                return parts;
            });

            const maxCols = Math.max(...rows.map(r => r.length));
            const dummyHeaders = Array.from({ length: maxCols }, (_, i) => `Coluna ${i + 1}`);
            
            const dataRows = rows.map(row => {
                const obj: any = {};
                dummyHeaders.forEach((h, i) => {
                    obj[h] = row[i] || '';
                });
                return obj;
            });

            setHeaders(dummyHeaders);
            setFileData(dataRows);
            setStep('mapping');
            setStatus({ type: 'idle', message: '' });
        }
    };

    const autoMap = (fileHeaders: string[]) => {
        const newMapping: ColumnMapping = {};
        const lowerHeaders = fileHeaders.map(h => h.toLowerCase());

        SYSTEM_FIELDS.forEach(field => {
            const index = lowerHeaders.findIndex(h => 
                h.includes(field.key.toLowerCase()) || 
                h.includes(field.label.toLowerCase()) ||
                (field.key === 'name' && (h.includes('produto') || h.includes('descrição'))) ||
                (field.key === 'price' && (h.includes('valor') || h.includes('venda'))) ||
                (field.key === 'stock' && (h.includes('qtd') || h.includes('quantidade')))
            );
            if (index !== -1) {
                newMapping[field.key] = fileHeaders[index];
            }
        });
        setMapping(newMapping);
    };

    const handleMappingChange = (systemField: string, fileHeader: string) => {
        setMapping(prev => ({ ...prev, [systemField]: fileHeader }));
    };

    const handleImport = async () => {
        setStatus({ type: 'loading', message: 'Importando produtos...' });
        try {
            const categories = await db.getAll('categories');
            const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

            let importedCount = 0;
            for (const row of fileData) {
                const name = row[mapping['name']];
                if (!name) continue;

                // Handle Category
                let categoryId = 'Sem Categoria';
                const catName = row[mapping['categoryName']];
                if (catName) {
                    const existingCatId = categoryMap.get(String(catName).toLowerCase());
                    if (existingCatId) {
                        categoryId = existingCatId;
                    } else {
                        const newCatId = uuidv4();
                        await db.add('categories', { id: newCatId, name: String(catName) });
                        categoryMap.set(String(catName).toLowerCase(), newCatId);
                        categoryId = newCatId;
                    }
                }

                // Parse Price
                const priceRaw = row[mapping['price']];
                const price = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw || '0').replace(',', '.'));

                const costPriceRaw = row[mapping['costPrice']];
                const costPrice = typeof costPriceRaw === 'number' ? costPriceRaw : parseFloat(String(costPriceRaw || '0').replace(',', '.'));

                // Parse Stock
                const stockRaw = row[mapping['stock']];
                const stock = typeof stockRaw === 'number' ? stockRaw : parseFloat(String(stockRaw || '0').replace(',', '.'));

                // Parse Unit Type
                const unitTypeRaw = String(row[mapping['unitType']] || '').toUpperCase();
                const unitType: 'UN' | 'KG' = unitTypeRaw.includes('KG') || unitTypeRaw.includes('QUILO') ? 'KG' : 'UN';

                // Parse Conversion Factor
                const conversionFactorRaw = row[mapping['purchaseConversionFactor']];
                const purchaseConversionFactor = typeof conversionFactorRaw === 'number' ? conversionFactorRaw : parseFloat(String(conversionFactorRaw || '1').replace(',', '.'));

                const newProduct: Product = {
                    id: String(row[mapping['id']] || uuidv4()),
                    name: String(name),
                    brand: String(row[mapping['brand']] || ''),
                    price: price,
                    costPrice: costPrice || 0,
                    unitType: unitType,
                    isBulk: unitType === 'KG',
                    stock: stock || 0,
                    categoryId: categoryId,
                    sku: String(row[mapping['id']] || row[mapping['barcode']] || ''),
                    barcode: String(row[mapping['barcode']] || ''),
                    purchaseConversionFactor: purchaseConversionFactor || 1,
                };

                // Salva localmente
                await db.put('products', newProduct);
                importedCount++;
            }

            setStatus({ type: 'success', message: `${importedCount} produtos importados com sucesso!` });
            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Erro na importação:", error);
            setStatus({ type: 'error', message: 'Erro ao importar produtos. Verifique o mapeamento e os dados.' });
        }
    };

    const seedSampleData = async () => {
        setStatus({ type: 'loading', message: 'Semeando 20 páginas de produtos...' });
        try {
            const categories = ['Mercearia', 'Hortifruti', 'Bebidas', 'Limpeza', 'Higiene', 'Padaria', 'Frios', 'Carnes'];
            const categoryIds: string[] = [];
            
            for (const cat of categories) {
                const id = uuidv4();
                await db.add('categories', { id, name: cat });
                categoryIds.push(id);
            }

            const productsToSeed = [];
            // Seed 200 products (approx 20 pages if 10 per page)
            for (let i = 1; i <= 200; i++) {
                const catIdx = Math.floor(Math.random() * categories.length);
                const unitType: 'UN' | 'KG' = Math.random() > 0.3 ? 'UN' : 'KG';
                
                productsToSeed.push({
                    id: `SAMPLE-${i.toString().padStart(4, '0')}`,
                    name: `Produto Exemplo ${i} - ${categories[catIdx]}`,
                    brand: 'Marca Própria',
                    price: Math.floor(Math.random() * 50) + 5.90,
                    costPrice: Math.floor(Math.random() * 30) + 2.50,
                    unitType: unitType,
                    isBulk: unitType === 'KG',
                    stock: Math.floor(Math.random() * 100),
                    categoryId: categoryIds[catIdx],
                    sku: `SKU-${i}`,
                    barcode: `789${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
                });
            }

            for (const p of productsToSeed) {
                await db.put('products', p as any);
            }

            setStatus({ type: 'success', message: '200 produtos de exemplo semeados com sucesso!' });
            setStep('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Erro ao semear:", error);
            setStatus({ type: 'error', message: 'Erro ao semear dados de exemplo.' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-theme-primary/10 text-theme-primary rounded-xl">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Importação Inteligente</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Excel, CSV ou PDF com mapeamento flexível</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'upload' && (
                        <div className="space-y-8 py-8 text-center">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-4 border-dashed border-gray-100 dark:border-gray-700 rounded-[40px] p-16 hover:border-theme-primary/50 hover:bg-theme-primary/5 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-full group-hover:scale-110 transition-transform">
                                        <FileSpreadsheet size={48} className="text-theme-primary" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white">Clique para selecionar o arquivo</p>
                                        <p className="text-xs font-bold text-gray-400 uppercase mt-1">Suporta .xlsx, .xls, .csv e .pdf</p>
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xlsx,.xls,.csv,.pdf" 
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <div className="flex items-center gap-4 py-4">
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase">Ou use dados de teste</span>
                                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                            </div>

                            <button 
                                onClick={seedSampleData}
                                className="flex items-center gap-3 mx-auto px-8 py-4 bg-emerald-500/10 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all group"
                            >
                                <Database size={20} className="group-hover:rotate-12 transition-transform" />
                                <span className="text-xs font-black uppercase tracking-widest">Gerar 20 Páginas de Produtos de Exemplo</span>
                            </button>
                        </div>
                    )}

                    {step === 'mapping' && (
                        <div className="space-y-6">
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex gap-3">
                                <Settings2 className="text-amber-500 shrink-0" size={20} />
                                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-relaxed">
                                    Mapeie as colunas do seu arquivo para os campos do sistema. <br/>
                                    <span className="font-black text-amber-800 dark:text-amber-300">Campos com * são obrigatórios.</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {SYSTEM_FIELDS.map(field => (
                                    <div key={field.key} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700 flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <select 
                                            className="w-full p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-theme-primary"
                                            value={mapping[field.key] || ''}
                                            onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                        >
                                            <option value="">-- Ignorar Coluna --</option>
                                            {headers.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border dark:border-gray-700">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-3">Prévia dos Dados (Primeiras 3 linhas)</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[9px] font-bold uppercase">
                                        <thead>
                                            <tr className="border-b dark:border-gray-700">
                                                {headers.map(h => <th key={h} className="px-2 py-1 text-left">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fileData.slice(0, 3).map((row, i) => (
                                                <tr key={i} className="border-b dark:border-gray-700 last:border-0">
                                                    {headers.map(h => <td key={h} className="px-2 py-1 text-gray-500">{String(row[h] || '')}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-16 text-center space-y-4">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Importação Concluída!</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{status.message}</p>
                        </div>
                    )}

                    {status.type === 'loading' && (
                        <div className="py-16 text-center space-y-4">
                            <div className="w-16 h-16 border-4 border-theme-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs font-black uppercase tracking-widest text-theme-primary">{status.message}</p>
                        </div>
                    )}

                    {status.type === 'error' && (
                        <div className="p-4 bg-red-500/10 text-red-600 rounded-2xl flex items-center gap-3 mt-4">
                            <AlertCircle size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">{status.message}</span>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
                    {step === 'mapping' && (
                        <Button 
                            onClick={handleImport} 
                            disabled={!mapping['name'] || !mapping['price'] || status.type === 'loading'} 
                            className="flex-1"
                        >
                            Iniciar Importação <ArrowRight size={18} className="ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductImportModal;

