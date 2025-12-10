import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Segment } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, Users } from 'lucide-react';
import { getCustomersForSegment } from '../../services/crmService';

interface SegmentationProps {
    onNewSegment: () => void;
    onEditSegment: (segmentId: string) => void;
}

// --- COMPONENTE PRINCIPAL DE SEGMENTAÇÃO ---
const Segmentation: React.FC<SegmentationProps> = ({ onNewSegment, onEditSegment }) => {
    const [segments, setSegments] = useState<Segment[]>([]);
    const [customerCounts, setCustomerCounts] = useState<Record<string, number>>({});
    
    const fetchSegments = useCallback(async () => {
        const allSegments = await db.getAll('segments');
        setSegments(allSegments);
        
        // Calcula a contagem de clientes para cada segmento.
        const counts: Record<string, number> = {};
        for (const seg of allSegments) {
            const customers = await getCustomersForSegment(seg);
            counts[seg.id] = customers.length;
        }
        setCustomerCounts(counts);
    }, []);

    useEffect(() => {
        fetchSegments();
    }, [fetchSegments]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza? Isso pode afetar campanhas que usam este segmento.')) {
            await db.delete('segments', id);
            fetchSegments();
        }
    };

    return (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Segmentos de Clientes</h2>
                <Button onClick={onNewSegment}>
                    <PlusCircle size={18}/> Novo Segmento
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map(segment => (
                    <div key={segment.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
                        <div className="flex justify-between items-start">
                             <h3 className="font-bold text-lg">{segment.name}</h3>
                             <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Users size={16}/>
                                <span>{customerCounts[segment.id] ?? '...'}</span>
                             </div>
                        </div>
                       
                        <p className="text-sm text-gray-600 dark:text-gray-300 h-10">{segment.description}</p>
                        <div className="text-xs text-gray-500 pt-2">
                            <strong>Regra: </strong> 
                            {segment.rules.map(r => r.type).join(', ')}
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
                             <Button variant="secondary" className="p-2 h-auto" onClick={() => onEditSegment(segment.id)}><Edit size={16}/></Button>
                             <Button variant="danger" className="p-2 h-auto" onClick={() => handleDelete(segment.id)}><Trash2 size={16}/></Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Segmentation;
