import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../services/databaseService';
import type { Segment, SegmentRule, SegmentRuleType } from '../../types';
import Button from '../shared/Button';
import { Save } from 'lucide-react';

interface SegmentFormPageProps {
  segmentId?: string;
  onBack: () => void;
}

// --- EDITOR DE REGRA INDIVIDUAL ---
const RuleEditor: React.FC<{ rule: SegmentRule; onChange: (rule: SegmentRule) => void;}> = ({ rule, onChange }) => {
    const ruleOptions: { value: SegmentRuleType; label: string; paramLabel?: string }[] = [
        { value: 'INACTIVE_CUSTOMERS', label: 'Clientes Inativos (sem compras há X dias)', paramLabel: 'Dias de Inatividade' },
        { value: 'BIRTHDAY_MONTH', label: 'Aniversariantes do Mês Atual' },
    ];
    
    const selectedOption = ruleOptions.find(o => o.value === rule.type);

    return (
        <div className="flex items-center gap-4">
            <select value={rule.type} onChange={e => onChange({ type: e.target.value as SegmentRuleType, value: rule.value })} className="flex-grow rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                {ruleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {selectedOption?.paramLabel && (
                 <input 
                    type="number" 
                    value={rule.value as number || ''} 
                    onChange={e => onChange({ ...rule, value: parseInt(e.target.value, 10) })}
                    placeholder={selectedOption.paramLabel}
                    className="w-32 rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
            )}
        </div>
    );
}

// --- COMPONENTE DE PÁGINA DE FORMULÁRIO DE SEGMENTO ---
const SegmentFormPage: React.FC<SegmentFormPageProps> = ({ segmentId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Segment>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (segmentId) {
                const segment = await db.get('segments', segmentId);
                if (segment) setFormData(segment);
                else onBack();
            } else {
                setFormData({
                    id: uuidv4(),
                    name: '',
                    description: '',
                    rules: [{ type: 'INACTIVE_CUSTOMERS', value: 30 }]
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [segmentId, onBack]);

    const handleRuleChange = (index: number, rule: SegmentRule) => {
        const newRules = [...(formData.rules || [])];
        newRules[index] = rule;
        setFormData(prev => ({ ...prev, rules: newRules }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.rules || formData.rules.length === 0) {
            alert('Nome e pelo menos uma regra são obrigatórios.');
            return;
        }
        await db.put('segments', formData as Segment);
        onBack();
    };
    
    if (isLoading) {
        return <div className="text-center p-8">Carregando dados do segmento...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Nome do Segmento</label>
                    <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required className="mt-1 w-full rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">Descrição</label>
                    <input type="text" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} required className="mt-1 w-full rounded-md dark:bg-gray-700 border-gray-300 dark:border-gray-600"/>
                </div>

                <fieldset className="border p-4 rounded-md dark:border-gray-600">
                    <legend className="text-sm font-medium px-2">Regras</legend>
                    {formData.rules && (
                        <RuleEditor rule={formData.rules[0]} onChange={(rule) => handleRuleChange(0, rule)} />
                    )}
                </fieldset>

                <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onBack}>Cancelar</Button>
                    <Button type="submit" variant="primary"><Save size={16} className="mr-2"/>Salvar Segmento</Button>
                </div>
            </form>
        </div>
    );
};

export default SegmentFormPage;
