
export interface ExpenseCategory {
    id: string;
    label: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    { id: 'cmv', label: 'CUSTO DA MERCADORIA VENDIDA (CMV)' },
    { id: 'frete', label: 'FRETE / LOGÍSTICA' },
    { id: 'embalagens', label: 'EMBALAGENS' },
    { id: 'impostos', label: 'IMPOSTOS' },
    { id: 'aluguel', label: 'ALUGUEL' },
    { id: 'folha', label: 'SALÁRIOS E ENCARGOS TRABALHISTAS' },
    { id: 'prolabore', label: 'PRÓ-LABORE' },
    { id: 'utilidades', label: 'UTILIDADES (ÁGUA/LUZ/INTERNET)' },
    { id: 'marketing', label: 'MARKETING E PUBLICIDADE' },
    { id: 'contabilidade', label: 'CONTABILIDADE' },
    { id: 'manutencao', label: 'MANUTENÇÃO E LIMPEZA' },
    { id: 'sistemas', label: 'SISTEMAS DE GESTÃO / SOFTWARE' },
    { id: 'equipamentos', label: 'EQUIPAMENTOS' },
    { id: 'panificacao', label: 'PANIFICAÇÃO' },
    { id: 'lanchonete', label: 'LANCHONETE' },
    { id: 'outros', label: 'OUTROS' }
];

export const getCategoryLabel = (id: string) => {
    return EXPENSE_CATEGORIES.find(c => c.id === id)?.label || 'Sem Categoria';
};
