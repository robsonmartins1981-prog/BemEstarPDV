import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../services/databaseService';
import type { Campaign, Segment } from '../../types';
import Button from '../shared/Button';
import { Save } from 'lucide-react';

interface CampaignFormPageProps {
  campaignId?: string;
  segments: Segment[];
  onBack: () => void;
}

const CampaignFormPage: React.FC<CampaignFormPageProps> = ({ campaignId, segments, onBack }) => {
    const [formData, setFormData] = useState<Partial<Campaign>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (campaignId) {
                const campaign = await db.get('campaigns', campaignId);
                if (campaign) setFormData(campaign);
                else onBack();
            } else {
                setFormData({
                    id: uuidv4(),
                    name: '',
                    segmentId: segments[0]?.id || '',
                    channel: 'EMAIL',
                    subject: '',
                    messageTemplate: 'Olá [Nome do Cliente],\n\nTemos uma novidade para você!',
                    status: 'DRAFT'
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [campaignId, onBack, segments]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.segmentId || !formData.messageTemplate) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }
        await db.put('campaigns', formData as Campaign);
        onBack();
    };
    
    if (isLoading) {
        return <div className="text-center p-8">Carregando dados da campanha...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Nome da Campanha</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Público-Alvo (Segmento)</label>
                        <select name="segmentId" value={formData.segmentId} onChange={handleChange} required className="mt-1 w-full rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                            {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Canal</label>
                    <select name="channel" value={formData.channel} onChange={handleChange} className="mt-1 w-full rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                        <option value="EMAIL">E-mail</option>
                        <option value="WHATSAPP">WhatsApp</option>
                    </select>
                </div>
                {formData.channel === 'EMAIL' && (
                    <div>
                        <label className="block text-sm font-medium">Assunto do E-mail</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="mt-1 w-full rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium">Mensagem (Template)</label>
                    <textarea name="messageTemplate" value={formData.messageTemplate} onChange={handleChange} rows={6} className="mt-1 w-full rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"></textarea>
                    <p className="text-xs text-gray-500 mt-1">Variáveis disponíveis: [Nome do Cliente], [Primeiro Nome]</p>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary"><Save size={16} className="mr-2"/> Salvar Campanha</Button>
                </div>
            </form>
        </div>
    );
}

export default CampaignFormPage;
