
import React, { useState } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { X, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import Button from '../shared/Button';

interface ProductImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const ProductImportModal: React.FC<ProductImportModalProps> = ({ onClose, onSuccess }) => {
    const [importText, setImportText] = useState('');
    const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
    const [preview, setPreview] = useState<any[]>([]);

    const parseData = (text: string) => {
        const lines = text.trim().split('\n');
        if (lines.length === 0) return [];

        // Detect delimiter (tab or semicolon or comma)
        const firstLine = lines[0];
        let delimiter = '\t';
        if (firstLine.includes(';')) delimiter = ';';
        else if (firstLine.includes(',')) delimiter = ',';

        return lines.map(line => {
            const cols = line.split(delimiter).map(c => c.trim());
            return {
                cod_produto: cols[0],
                nome_produto: cols[1],
                ref_venda: cols[2],
                nome_grupo_produto: cols[3],
                nome_tamanho_1: cols[4]
            };
        });
    };

    const handlePreview = () => {
        const parsed = parseData(importText);
        setPreview(parsed);
    };

    const handleImport = async () => {
        if (!importText.trim()) return;

        setStatus({ type: 'loading', message: 'Importando produtos...' });
        try {
            const data = parseData(importText);
            const categories = await db.getAll('categories');
            const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

            for (const item of data) {
                if (!item.nome_produto) continue;

                // Handle Category
                let categoryId = 'Sem Categoria';
                if (item.nome_grupo_produto) {
                    const catName = item.nome_grupo_produto;
                    const existingCatId = categoryMap.get(catName.toLowerCase());
                    if (existingCatId) {
                        categoryId = existingCatId;
                    } else {
                        const newCatId = uuidv4();
                        await db.add('categories', { id: newCatId, name: catName });
                        categoryMap.set(catName.toLowerCase(), newCatId);
                        categoryId = newCatId;
                    }
                }

                // Parse Price
                const price = parseFloat(item.ref_venda?.replace(',', '.') || '0');

                // Parse Unit Type
                const unitTypeRaw = item.nome_tamanho_1?.toUpperCase() || 'UN';
                const unitType: 'UN' | 'KG' = unitTypeRaw.includes('KG') || unitTypeRaw.includes('QUILO') ? 'KG' : 'UN';

                const newProduct: Product = {
                    id: item.cod_produto || uuidv4(),
                    name: item.nome_produto,
                    price: price,
                    unitType: unitType,
                    isBulk: unitType === 'KG',
                    stock: 0,
                    categoryId: categoryId,
                    sku: item.cod_produto,
                    barcode: item.cod_produto
                };

                await db.put('products', newProduct);
            }

            setStatus({ type: 'success', message: `${data.length} produtos importados com sucesso!` });
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Erro na importação:", error);
            setStatus({ type: 'error', message: 'Erro ao importar produtos. Verifique o formato dos dados.' });
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
                            <h2 className="text-xl font-black uppercase tracking-tight text-gray-800 dark:text-white">Importar Produtos</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cole seus dados do Excel ou CSV abaixo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
                        <FileText className="text-blue-500 shrink-0" size={20} />
                        <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase leading-relaxed">
                            Formato esperado (Colunas): <br/>
                            <span className="font-black text-blue-800 dark:text-blue-300">cod_produto | nome_produto | ref_venda | nome_grupo_produto | nome_tamanho_1</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase ml-1">Dados para Importação</label>
                        <textarea
                            className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-mono text-xs resize-none"
                            placeholder="Cole aqui as linhas do seu Excel..."
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                        />
                    </div>

                    {preview.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1">Prévia ({preview.length} itens)</label>
                            <div className="border dark:border-gray-700 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-[10px] font-bold uppercase">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                                        <tr>
                                            <th className="px-3 py-2">Cód</th>
                                            <th className="px-3 py-2">Nome</th>
                                            <th className="px-3 py-2">Preço</th>
                                            <th className="px-3 py-2">Grupo</th>
                                            <th className="px-3 py-2">Un/Kg</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-700">
                                        {preview.slice(0, 5).map((p, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 text-gray-500">{p.cod_produto}</td>
                                                <td className="px-3 py-2">{p.nome_produto}</td>
                                                <td className="px-3 py-2 text-theme-primary">{p.ref_venda}</td>
                                                <td className="px-3 py-2 text-gray-400">{p.nome_grupo_produto}</td>
                                                <td className="px-3 py-2">{p.nome_tamanho_1}</td>
                                            </tr>
                                        ))}
                                        {preview.length > 5 && (
                                            <tr>
                                                <td colSpan={5} className="px-3 py-2 text-center text-gray-400 italic">
                                                    ... e mais {preview.length - 5} itens
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {status.type !== 'idle' && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
                            status.type === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 
                            status.type === 'error' ? 'bg-red-500/10 text-red-600' : 
                            'bg-theme-primary/10 text-theme-primary'
                        }`}>
                            {status.type === 'success' ? <CheckCircle2 size={20} /> : 
                             status.type === 'error' ? <AlertCircle size={20} /> : 
                             <div className="w-5 h-5 border-2 border-theme-primary border-t-transparent rounded-full animate-spin"></div>}
                            <span className="text-xs font-black uppercase tracking-widest">{status.message}</span>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
                    <Button variant="secondary" onClick={handlePreview} disabled={!importText.trim()} className="flex-1">Ver Prévia</Button>
                    <Button onClick={handleImport} disabled={!importText.trim() || status.type === 'loading'} className="flex-1">
                        Confirmar Importação
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductImportModal;
