import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/databaseService';
import type { Campaign, Segment } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, Send } from 'lucide-react';
import { dispatchCampaign } from '../../services/crmService';

interface CampaignsProps {
    onNewCampaign: () => void;
    onEditCampaign: (campaignId: string) => void;
}

const Campaigns: React.FC<CampaignsProps> = ({ onNewCampaign, onEditCampaign }) => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    
    const fetchData = useCallback(async () => {
        const [allCampaigns, allSegments] = await Promise.all([
            db.getAll('campaigns'),
            db.getAll('segments')
        ]);
        setCampaigns(allCampaigns);
        setSegments(allSegments);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta campanha?')) {
            await db.delete('campaigns', id);
            fetchData();
        }
    };
    
    const handleDispatch = async (campaign: Campaign) => {
        if (confirm(`Deseja simular o envio da campanha "${campaign.name}"? Verifique o console do navegador para ver os resultados.`)) {
            try {
                const result = await dispatchCampaign(campaign.id);
                alert(`Simulação concluída! ${result.sent} mensagens foram "enviadas" para ${result.customerCount} clientes. Veja o console para detalhes.`);
                await db.put('campaigns', { ...campaign, status: 'SENT' });
                fetchData();
            } catch (error) {
                console.error("Erro ao disparar campanha:", error);
                alert(`Ocorreu um erro: ${(error as Error).message}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Campanhas de Marketing</h2>
                <Button onClick={onNewCampaign} disabled={segments.length === 0}>
                    <PlusCircle size={18}/> Nova Campanha
                </Button>
            </div>
             {segments.length === 0 && (
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
                    <strong>Atenção:</strong> Você precisa criar pelo menos um Segmento antes de criar uma campanha.
                </div>
            )}
            
            <div className="space-y-4">
                 {campaigns.map(campaign => {
                     const segment = segments.find(s => s.id === campaign.segmentId);
                     return (
                        <div key={campaign.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{campaign.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Público: <span className="font-semibold">{segment?.name || 'N/A'}</span> | Canal: <span className="font-semibold">{campaign.channel}</span>
                                </p>
                                <span className={`text-xs font-bold py-1 px-2 rounded-full ${campaign.status === 'DRAFT' ? 'bg-gray-200 dark:bg-gray-600' : 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300'}`}>
                                    {campaign.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="primary" onClick={() => handleDispatch(campaign)} disabled={campaign.status === 'SENT'}><Send size={16}/> Disparar</Button>
                                <Button variant="secondary" className="p-2 h-auto" onClick={() => onEditCampaign(campaign.id)}><Edit size={16}/></Button>
                                <Button variant="danger" className="p-2 h-auto" onClick={() => handleDelete(campaign.id)}><Trash2 size={16}/></Button>
                            </div>
                        </div>
                     );
                 })}
            </div>
        </div>
    );
};

export default Campaigns;
