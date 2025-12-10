
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/databaseService';
import type { Product, Category, Supplier } from '../../types';
import Button from '../shared/Button';
import { Filter, ShoppingBag, Download, Printer } from 'lucide-react';

interface OrderItem {
    product: Product;
    currentStock: number;
    minStock: number;
    suggestedQty: number;
    supplierName?: string;
}

const GenerateOrder: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [customThreshold, setCustomThreshold] = useState<string>(''); // Override global threshold
    
    // Selection for export
    const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [allProducts, allCategories, allSuppliers] = await Promise.all([
                db.getAll('products'),
                db.getAll('categories'),
                db.getAll('suppliers')
            ]);
            setProducts(allProducts);
            setCategories(allCategories.sort((a,b) => a.name.localeCompare(b.name)));
            setSuppliers(allSuppliers.sort((a,b) => a.name.localeCompare(b.name)));
            setLoading(false);
        };
        loadData();
    }, []);

    const supplierMap = useMemo(() => {
        const map = new Map<string, string>();
        suppliers.forEach(s => map.set(s.id, s.name));
        return map;
    }, [suppliers]);

    const categoryMap = useMemo(() => {
        const map = new Map<string, string>();
        categories.forEach(c => map.set(c.id, c.name));
        return map;
    }, [categories]);

    // Core Logic: Generate list based on filters
    const orderItems: OrderItem[] = useMemo(() => {
        const thresholdOverride = customThreshold ? parseFloat(customThreshold) : null;

        return products
            .filter(p => {
                // Filter by Category
                if (selectedCategory && p.categoryId !== selectedCategory) return false;
                
                // Filter by Supplier
                if (selectedSupplier && p.supplierId !== selectedSupplier) return false;

                // Determine effective minimum stock
                // If a custom threshold is set, use it. Otherwise use product's minStock.
                // If neither exists, assume 0 (which means it won't show up unless stock is negative).
                const effectiveMin = thresholdOverride !== null ? thresholdOverride : (p.minStock || 0);

                // Only show items where stock is BELOW the minimum
                return p.stock < effectiveMin;
            })
            .map(p => {
                const effectiveMin = thresholdOverride !== null ? thresholdOverride : (p.minStock || 0);
                return {
                    product: p,
                    currentStock: p.stock,
                    minStock: effectiveMin,
                    // Suggested: Bring it back to Min Stock + a small buffer (e.g. 20% or simply restore to min)
                    // For now, let's suggest simply restoring to the minimum required.
                    suggestedQty: Math.max(0, effectiveMin - p.stock),
                    supplierName: p.supplierId ? supplierMap.get(p.supplierId) : 'Desconhecido'
                };
            })
            .sort((a, b) => a.product.name.localeCompare(b.product.name));
    }, [products, selectedCategory, selectedSupplier, customThreshold, supplierMap]);

    // Handle Checkbox Selection
    const toggleSelectAll = () => {
        if (selectedProductIds.size === orderItems.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(orderItems.map(i => i.product.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedProductIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedProductIds(newSet);
    };

    const handlePrint = () => {
        const itemsToPrint = orderItems.filter(i => selectedProductIds.has(i.product.id));
        if (itemsToPrint.length === 0) return alert("Selecione itens para imprimir.");

        let printContent = `
            <html>
            <head>
                <title>Lista de Compras - UseNatural</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #eee; }
                    h1 { color: #00843D; }
                </style>
            </head>
            <body>
                <h1>Lista de Sugestão de Compras</h1>
                <p>Data: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Fornecedor</th>
                            <th>Estoque Atual</th>
                            <th>Estoque Mín.</th>
                            <th>Sugestão Compra</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        itemsToPrint.forEach(item => {
            printContent += `
                <tr>
                    <td>${item.product.name}</td>
                    <td>${item.supplierName || '-'}</td>
                    <td>${item.currentStock}</td>
                    <td>${item.minStock}</td>
                    <td><strong>${item.suggestedQty} ${item.product.isBulk ? 'kg' : 'un'}</strong></td>
                </tr>
            `;
        });

        printContent += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando dados...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold">Gerar Pedidos de Compra</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Crie listas baseadas em produtos abaixo do estoque mínimo.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handlePrint} disabled={selectedProductIds.size === 0}>
                            <Printer size={18} className="mr-2"/> Imprimir Selecionados
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Categoria</label>
                        <select 
                            value={selectedCategory} 
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">Todas</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Fornecedor</label>
                        <select 
                            value={selectedSupplier} 
                            onChange={e => setSelectedSupplier(e.target.value)}
                            className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">Todos</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Estoque Mínimo (Global)</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={customThreshold}
                                onChange={e => setCustomThreshold(e.target.value)}
                                placeholder="Padrão do Produto"
                                className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="absolute right-2 top-2 text-xs text-gray-400 pointer-events-none">un/kg</span>
                        </div>
                    </div>
                    <div className="flex items-end pb-1">
                        <div className="text-sm text-gray-500">
                            <Filter size={14} className="inline mr-1"/>
                            Mostrando <strong>{orderItems.length}</strong> produtos críticos.
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela de Resultados */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="p-4 w-8">
                                <input 
                                    type="checkbox" 
                                    checked={orderItems.length > 0 && selectedProductIds.size === orderItems.length}
                                    onChange={toggleSelectAll}
                                    className="cursor-pointer"
                                />
                            </th>
                            <th className="px-6 py-3">Produto</th>
                            <th className="px-6 py-3">Fornecedor</th>
                            <th className="px-6 py-3 text-right">Estoque Atual</th>
                            <th className="px-6 py-3 text-right">Mínimo</th>
                            <th className="px-6 py-3 text-right bg-blue-50 dark:bg-blue-900/20 font-bold text-blue-800 dark:text-blue-200">Sugestão</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderItems.length === 0 ? (
                             <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    <ShoppingBag size={48} className="mx-auto mb-2 opacity-20"/>
                                    Nenhum produto encontrado com estoque abaixo do mínimo para os filtros selecionados.
                                </td>
                            </tr>
                        ) : (
                            orderItems.map((item) => (
                                <tr key={item.product.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                    <td className="p-4 text-center">
                                         <input 
                                            type="checkbox" 
                                            checked={selectedProductIds.has(item.product.id)}
                                            onChange={() => toggleSelect(item.product.id)}
                                            className="cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-xs text-gray-500">{categoryMap.get(item.product.categoryId || '')}</p>
                                    </td>
                                    <td className="px-6 py-3">{item.supplierName}</td>
                                    <td className="px-6 py-3 text-right font-mono text-red-600 font-semibold">{item.currentStock}</td>
                                    <td className="px-6 py-3 text-right font-mono">{item.minStock}</td>
                                    <td className="px-6 py-3 text-right font-mono bg-blue-50 dark:bg-blue-900/10 font-bold text-blue-600 dark:text-blue-400">
                                        {item.suggestedQty} {item.product.isBulk ? 'kg' : 'un'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GenerateOrder;
