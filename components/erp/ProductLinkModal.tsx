import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { db } from '../../services/databaseService';
import type { Product, NFeItem } from '../../types';
import { Search } from 'lucide-react';

interface ProductLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkProduct: (product: Product) => void;
  nfeItem?: NFeItem;
}

const ProductLinkModal: React.FC<ProductLinkModalProps> = ({ isOpen, onClose, onLinkProduct, nfeItem }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Product[]>([]);

    useEffect(() => {
        if (isOpen && nfeItem) {
            // Pre-fill search with NFe item name to give immediate suggestions
            handleSearch(nfeItem.name);
        } else if (!isOpen) { // Reset on close
            setSearchTerm('');
            setResults([]);
        }
    }, [isOpen, nfeItem]);

    const handleSearch = async (query: string) => {
        setSearchTerm(query);
        if (query.length < 2) {
            setResults([]);
            return;
        }
        const allProducts = await db.getAll('products');
        const lowerCaseQuery = query.toLowerCase();
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(lowerCaseQuery) || p.id.includes(query)
        );
        setResults(filtered);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Vincular Item: ${nfeItem?.name || ''}`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Busque pelo nome ou código de barras para encontrar o produto correspondente no seu sistema.
                </p>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        autoFocus
                    />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                    {results.map(product => (
                        <div key={product.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <div>
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-gray-500">ID: {product.id}</p>
                            </div>
                            <Button variant="primary" className="text-sm !py-1 !px-3" onClick={() => onLinkProduct(product)}>
                                Vincular
                            </Button>
                        </div>
                    ))}
                     {results.length === 0 && searchTerm.length >= 2 && (
                        <p className="text-center text-gray-500 py-4">Nenhum produto encontrado.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ProductLinkModal;
