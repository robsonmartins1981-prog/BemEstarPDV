
import React from 'react';
import type { NfceConfig } from '../../../../types';

interface FormNfceProps {
    data: NfceConfig;
    onChange: (data: NfceConfig) => void;
}

const FormNfce: React.FC<FormNfceProps> = ({ data, onChange }) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        onChange({
            ...data,
            [name]: type === 'number' ? parseInt(value, 10) : value,
        });
    };

    const inputStyle = "mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-theme-primary focus:ring-theme-primary text-base md:text-sm py-2";
    
    return (
        <div className="space-y-6">
            <fieldset className="border p-3 md:p-4 rounded-md dark:border-gray-600">
                <legend className="text-md font-semibold px-2">Configurações Gerais da NFC-e</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium">Ambiente de Emissão</label>
                        <select name="ambiente" value={data.ambiente} onChange={handleChange} className={inputStyle}>
                            <option value="Homologacao">Homologação (Testes)</option>
                            <option value="Producao">Produção (Oficial)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Série Padrão da NFC-e</label>
                        <input type="number" name="serieNFCe" value={data.serieNFCe} onChange={handleChange} className={inputStyle}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Próximo Número (NNF)</label>
                        <input type="number" name="proximoNumeroNFCe" value={data.proximoNumeroNFCe} onChange={handleChange} className={inputStyle}/>
                    </div>
                </div>
            </fieldset>

            <fieldset className="border p-3 md:p-4 rounded-md dark:border-gray-600">
                <legend className="text-md font-semibold px-2">CSC - Código de Segurança</legend>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-2">
                    Token fornecido pela SEFAZ. Obrigatório.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <div>
                        <label className="block text-sm font-medium">ID do CSC (ou Identificador)</label>
                        <input type="text" name="cscId" value={data.cscId} onChange={handleChange} className={inputStyle} placeholder="Ex: 000001"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Token CSC (Código)</label>
                        <input type="password" name="cscToken" value={data.cscToken} onChange={handleChange} className={inputStyle}/>
                    </div>
                </div>
            </fieldset>
        </div>
    );
};

export default FormNfce;
