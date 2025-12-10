import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { db } from '../../services/databaseService';
import type { InventoryAdjustment, InventoryLot } from '../../types';

interface AdjustmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
}

// Componente para exibir o histórico de ajustes de um produto.
const AdjustmentHistoryModal: React.FC<AdjustmentHistoryModalProps> = ({ isOpen, onClose, productId }) => {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [lots, setLots] = useState<Map<string, InventoryLot>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      setIsLoading(true);
      try {
        const [adjData, lotData] = await Promise.all([
          db.getAllFromIndex('inventoryAdjustments', 'productId', productId),
          db.getAllFromIndex('inventoryLots', 'productId', productId)
        ]);

        // Cria um mapa de lotes para fácil acesso
        const lotMap = new Map<string, InventoryLot>();
        lotData.forEach(lot => lotMap.set(lot.id, lot));
        
        setAdjustments(adjData.sort((a, b) => b.date.getTime() - a.date.getTime())); // Mais recentes primeiro
        setLots(lotMap);
      } catch (error) {
        console.error("Erro ao buscar histórico de ajustes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, productId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histórico de Ajustes de Estoque">
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <p>Carregando histórico...</p>
        ) : adjustments.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Nenhum ajuste manual encontrado para este produto.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Lote (Validade)</th>
                <th className="px-4 py-2 text-center">Alteração</th>
                <th className="px-4 py-2">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(adj => {
                const lot = lots.get(adj.lotId);
                const isEntry = adj.quantityChange > 0;
                return (
                  <tr key={adj.id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-2">{new Date(adj.date).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-2 text-xs">
                      {lot ? `Val: ${lot.expirationDate?.toLocaleDateString('pt-BR') || 'N/A'}` : 'Lote desconhecido'}
                    </td>
                    <td className={`px-4 py-2 text-center font-bold ${isEntry ? 'text-green-600' : 'text-red-600'}`}>
                      {isEntry ? '+' : ''}{adj.quantityChange}
                    </td>
                    <td className="px-4 py-2">{adj.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
};

export default AdjustmentHistoryModal;
