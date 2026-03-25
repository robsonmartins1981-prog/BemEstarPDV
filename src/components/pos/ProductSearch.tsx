
import React, { useState, useEffect, useRef } from 'react';
import { db, searchByIndex, getPaginated } from '../../services/databaseService';
import type { Product } from '../../types';
import { formatCurrency, formatQuantity } from '../../utils/formatUtils';
import { Search, Package, Plus } from 'lucide-react';

interface ProductSearchProps {
  onSelect: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const search = async () => {
      try {
        if (searchTerm.trim().length === 0) {
          setResults([]);
          return;
        }
        
        // Tenta buscar por código de barras exato primeiro (mais comum no PDV)
        const barcodeResults = await searchByIndex('products', 'scaleCode', searchTerm.trim());
        if (barcodeResults.length > 0) {
          setResults(barcodeResults.slice(0, 10));
          setSelectedIndex(0);
          
          const config = await db.get('appConfig', 'main');
          if (config?.autoAddOnBarcodeMatch) {
            onSelect(barcodeResults[0]);
            setSearchTerm('');
            return;
          }
        }

        // Busca por ID exato
        const idResult = await db.get('products', searchTerm.trim());
        if (idResult) {
          setResults([idResult]);
          setSelectedIndex(0);
          return;
        }

        // Busca por nome (parcial) - ainda requer getAll ou um cursor filtrado
        // Para otimizar, pegamos apenas os primeiros 100 produtos e filtramos
        const allProducts = await getPaginated('products', 200, 0);
        const filtered = (allProducts || []).filter(p => 
          p && (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        ).slice(0, 10);
        
        setResults(filtered);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Erro na busca de produtos:', error);
      }
    };
    
    const timeout = setTimeout(search, 150);
    return () => clearTimeout(timeout);
  }, [searchTerm, onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex]);
        setSearchTerm('');
      }
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar produto por nome, código ou EAN... (Enter para selecionar)"
          className="w-full pl-14 pr-4 py-6 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-3xl outline-none focus:border-theme-primary transition-all text-xl font-bold shadow-sm"
          autoFocus
        />
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] overflow-hidden">
          {results.map((product, index) => (
            <button
              key={product.id}
              onClick={() => { onSelect(product); setSearchTerm(''); }}
              className={`w-full flex items-center justify-between p-4 transition-all ${index === selectedIndex ? 'bg-theme-primary/10 border-l-4 border-theme-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent'}`}
            >
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 dark:text-white">{product.name}</p>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{product.barcode || product.id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-theme-primary">{formatCurrency(product.price)}</p>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{formatQuantity(product.stock)} em estoque</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
