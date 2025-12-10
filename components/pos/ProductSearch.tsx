import React, { useState, useRef, useEffect } from 'react';
import type { Product } from '../../types';
import { db } from '../../services/databaseService';
import { Search, Weight, Package } from 'lucide-react';

interface ProductSearchProps {
  onAddProduct: (product: Product, quantity: number) => void;
}

// Componente de busca de produtos.
// Permite ao operador encontrar produtos por código de barras (simulando um leitor) ou por nome.
const ProductSearch: React.FC<ProductSearchProps> = ({ onAddProduct }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  // Estado para o produto a granel selecionado, para o qual pediremos o peso.
  const [bulkProduct, setBulkProduct] = useState<Product | null>(null);
  const [weight, setWeight] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  // Efeito para focar e selecionar o campo de peso quando o modal de produto a granel aparece.
  useEffect(() => {
    if (bulkProduct && weightInputRef.current) {
        // Usamos um pequeno timeout para garantir que o navegador tenha renderizado o campo
        // e ele esteja pronto para receber o foco, especialmente após a mudança de estado.
        setTimeout(() => {
            weightInputRef.current?.focus();
            weightInputRef.current?.select();
        }, 50);
    }
  }, [bulkProduct]);

  // Lida com a busca de produtos por nome ou código enquanto o usuário digita.
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    setHighlightedIndex(-1); // Reseta o destaque a cada nova busca
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    // Busca todos os produtos e filtra na memória para a funcionalidade "contains".
    const allProducts = await db.getAll('products');
    
    const filteredResults = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerCaseQuery) ||
        p.id.includes(searchQuery) // Código de barras/interno geralmente é case-sensitive
    );

    setResults(filteredResults);
  };
  
  // Limpa o estado da busca e foca no input novamente.
  const resetSearch = () => {
    setQuery('');
    setResults([]);
    setBulkProduct(null);
    setWeight('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Lida com a seleção de um produto, seja da lista ou de uma leitura de código de barras.
  const selectProduct = (product: Product) => {
    // Se o produto for a granel, abre um modal/prompt para inserir o peso.
    if (product.isBulk) {
      setBulkProduct(product);
      setQuery('');
      setResults([]);
    } else {
      // Se for um produto unitário, adiciona com quantidade 1.
      onAddProduct(product, 1);
      resetSearch();
    }
  };

  // Lida com a tecla "Enter". Essencial para o leitor de código de barras,
  // que tipicamente envia um "Enter" após a leitura.
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Navegação com setas para cima/baixo na lista de resultados
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
      e.preventDefault(); // Previne qualquer comportamento padrão do "Enter".
      
      // Prioridade 1: Se um item estiver destacado na lista, seleciona ele.
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
          selectProduct(results[highlightedIndex]);
          return;
      }
      
      const trimmedQuery = query.trim();

      // --- LÓGICA PARA CÓDIGO DE BARRAS DA BALANÇA (BASEADO NO PESO) ---
      // Conforme o algoritmo Dart fornecido:
      const SCALE_PREFIX = "2";
      const PRODUCT_CODE_LENGTH = 6;
      const WEIGHT_VALUE_LENGTH = 5;
      const WEIGHT_DIVISOR = 1000; // Para converter gramas (ex: 100) para kg (ex: 0.100)

      if (trimmedQuery.startsWith(SCALE_PREFIX) && trimmedQuery.length === 13) {
        try {
            // "Desmonta" o código de barras
            const productScaleCode = trimmedQuery.substring(1, 1 + PRODUCT_CODE_LENGTH); // ex: "000541"
            const weightString = trimmedQuery.substring(1 + PRODUCT_CODE_LENGTH, 1 + PRODUCT_CODE_LENGTH + WEIGHT_VALUE_LENGTH); // ex: "00100"

            // Converte o peso para kg
            const quantityKg = parseInt(weightString, 10) / WEIGHT_DIVISOR; // ex: 100 / 1000 = 0.100

            if (!isNaN(quantityKg) && quantityKg > 0) {
                // Busca o produto pelo código da balança
                const product = await db.getFromIndex('products', 'scaleCode', productScaleCode);
                if (product && product.isBulk) {
                    onAddProduct(product, quantityKg);
                    resetSearch();
                    return; // Encerra a função após adicionar o produto da balança.
                }
            }
        } catch (error) {
            console.error("Erro ao decodificar código de barras da balança:", error);
            // Se der erro, a lógica continua para a busca normal.
        }
      }


      // --- LÓGICA PADRÃO (se não for código de balança) ---

      // Prioridade 2: Tenta encontrar um produto com o ID exato (código de barras).
      const productById = await db.get('products', trimmedQuery);
      
      if (productById) {
        // Se encontrou, seleciona o produto e ignora a lista de resultados.
        setResults([]); // Limpa a lista para não confundir.
        selectProduct(productById);
        return; // Encerra a função.
      }

      // Prioridade 3: Se não achou por ID e a lista de resultados da busca por nome
      // já tem itens, seleciona o primeiro da lista.
      if (results.length > 0) {
        selectProduct(results[0]);
      }
    }
  };


  // Confirma a adição de um produto a granel com o peso informado.
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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown} // Adicionado listener para "Enter" e setas
          placeholder="Digitar nome ou ler código de barras..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-theme-primary"
          autoFocus
        />
      </div>
      
      {/* Exibe os resultados da busca por nome */}
      {results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
          {results.map((product, index) => (
            <li
              key={product.id}
              onClick={() => selectProduct(product)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`p-3 hover:bg-theme-primary/10 dark:hover:bg-theme-primary/20 cursor-pointer flex justify-between items-center ${
                  index === highlightedIndex ? 'bg-theme-primary/20 dark:bg-theme-primary/30' : ''
              }`}
            >
              <div className="flex items-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-10 h-10 rounded-md object-cover mr-4" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ID: {product.id}</p>
                </div>
              </div>
              <span className="font-bold text-theme-primary">
                {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {product.isBulk ? ' /kg' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Modal simulado para inserção de peso */}
      {bulkProduct && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 z-20 flex flex-col items-center justify-center p-4 rounded-lg">
            <Weight className="w-12 h-12 text-theme-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">{bulkProduct.name}</h3>
            <p className="mb-4">Por favor, insira a quantidade (kg):</p>
            <input
                ref={weightInputRef}
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 0.250"
                className="w-full max-w-xs text-center text-2xl p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 ring-2 ring-theme-primary dark:ring-offset-gray-800"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmBulk()}
            />
            <div className="flex gap-4 mt-6">
                <button onClick={resetSearch} className="px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-600">Cancelar</button>
                <button onClick={handleConfirmBulk} className="px-6 py-2 rounded-md bg-theme-primary text-white">Confirmar</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;