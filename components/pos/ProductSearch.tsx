
import React, { useState, useRef, useEffect } from 'react';
import type { Product } from '../../types';
import { db } from '../../services/databaseService';
import { Search, Weight, Package, Hash } from 'lucide-react';

interface ProductSearchProps {
  onAddProduct: (product: Product, quantity: number) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onAddProduct }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [bulkProduct, setBulkProduct] = useState<Product | null>(null);
  const [weight, setWeight] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bulkProduct && weightInputRef.current) {
        setTimeout(() => {
            weightInputRef.current?.focus();
            weightInputRef.current?.select();
        }, 50);
    }
  }, [bulkProduct]);

  // Lida com a busca de produtos por nome ou código enquanto o usuário digita.
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setHighlightedIndex(-1);
    
    if (searchQuery.length < 1) {
      setResults([]);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const allProducts = await db.getAll('products');
    
    // Filtra por nome OU ID (Código Interno)
    const filteredResults = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerCaseQuery) ||
        p.id.toLowerCase().includes(lowerCaseQuery) ||
        p.scaleCode?.includes(searchQuery)
    ).slice(0, 8); // Limita a 8 sugestões para não poluir a tela

    setResults(filteredResults);
  };
  
  const resetSearch = () => {
    setQuery('');
    setResults([]);
    setBulkProduct(null);
    setWeight('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const selectProduct = (product: Product) => {
    if (product.isBulk) {
      setBulkProduct(product);
      setQuery('');
      setResults([]);
    } else {
      onAddProduct(product, 1);
      resetSearch();
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % results.length);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + results.length) % results.length);
            return;
        }
    }

    if (e.key === 'Enter' && query.trim().length > 0) {
      e.preventDefault();
      
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
          selectProduct(results[highlightedIndex]);
          return;
      }
      
      const trimmedQuery = query.trim();

      // Lógica de Balança
      const SCALE_PREFIX = "2";
      if (trimmedQuery.startsWith(SCALE_PREFIX) && trimmedQuery.length === 13) {
        const productScaleCode = trimmedQuery.substring(1, 7);
        const weightString = trimmedQuery.substring(7, 12);
        const quantityKg = parseInt(weightString, 10) / 1000;

        if (!isNaN(quantityKg) && quantityKg > 0) {
            const product = await db.getFromIndex('products', 'scaleCode', productScaleCode);
            if (product && product.isBulk) {
                onAddProduct(product, quantityKg);
                resetSearch();
                return;
            }
        }
      }

      // Busca Exata por ID
      const productById = await db.get('products', trimmedQuery);
      if (productById) {
        selectProduct(productById);
        return;
      }

      // Se houver sugestões, seleciona a primeira
      if (results.length > 0) {
        selectProduct(results[0]);
      }
    }
  };

  const handleConfirmBulk = () => {
    if (bulkProduct) {
        const quantity = parseFloat(weight.replace(',', '.'));
        if (!isNaN(quantity) && quantity > 0) {
            onAddProduct(bulkProduct, quantity);
            resetSearch();
        }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow relative z-30">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pesquisar por Nome ou Código (F1)..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-theme-primary transition-all"
          autoFocus
        />
      </div>
      
      {/* Lista de Sugestões / Relações de Itens */}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border-2 border-theme-primary/30 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sugestões Encontradas</span>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {results.map((product, index) => (
              <li
                key={product.id}
                onClick={() => selectProduct(product)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`p-3 cursor-pointer flex justify-between items-center transition-colors border-b last:border-0 dark:border-gray-700 ${
                    index === highlightedIndex ? 'bg-theme-primary/10 dark:bg-theme-primary/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover border dark:border-gray-600" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <Package size={20} />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{product.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                       <span className="flex items-center gap-0.5"><Hash size={10}/> {product.id}</span>
                       {product.isBulk && <span className="bg-orange-100 text-orange-700 px-1 rounded text-[9px] font-black uppercase">Pesável</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-theme-primary text-lg">
                    {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  {product.isBulk && <p className="text-[9px] text-gray-400 font-bold uppercase">Preço por KG</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de Peso */}
      {bulkProduct && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-98 dark:bg-opacity-98 z-50 flex flex-col items-center justify-center p-4 rounded-lg shadow-inner">
            <Weight className="w-12 h-12 text-theme-primary mb-2" />
            <h3 className="text-xl font-black mb-1">{bulkProduct.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Insira o peso em KG:</p>
            <input
                ref={weightInputRef}
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0,000"
                className="w-full max-w-xs text-center text-4xl font-mono p-4 border-2 border-theme-primary rounded-2xl dark:bg-gray-900 dark:border-gray-600 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmBulk()}
            />
            <div className="flex gap-3 mt-6 w-full max-w-xs">
                <button onClick={resetSearch} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold">Cancelar</button>
                <button onClick={handleConfirmBulk} className="flex-1 py-3 rounded-xl bg-theme-primary text-white font-bold shadow-lg shadow-theme-primary/30">Confirmar</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
