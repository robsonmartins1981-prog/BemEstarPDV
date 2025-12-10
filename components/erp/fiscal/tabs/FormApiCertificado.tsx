import React, { useState } from 'react';
import type { ApiConfig } from '../../../../types';
import Button from '../../../shared/Button';
import { UploadCloud } from 'lucide-react';

interface FormApiCertificadoProps {
    data: ApiConfig;
    onChange: (data: ApiConfig) => void;
}

const FormApiCertificado: React.FC<FormApiCertificadoProps> = ({ data, onChange }) => {
    
    const [certificateName, setCertificateName] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange({
            ...data,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCertificateName(file.name);
            // Em uma aplicação real, aqui você faria o upload seguro do arquivo
            // para um backend ou o armazenaria de forma segura.
            // Por enquanto, apenas exibimos o nome.
            console.log("Arquivo de certificado selecionado:", file.name);
        }
    };
    
    const inputStyle = "mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-theme-primary focus:ring-theme-primary";
    
    return (
        <div className="space-y-6">
            <fieldset className="border p-4 rounded-md dark:border-gray-600">
                <legend className="text-md font-semibold px-2">API Fiscal</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium">Provedor da API</label>
                        <select name="provedorApi" value={data.provedorApi} onChange={handleChange} className={inputStyle}>
                            <option value="TecnoSpeed">TecnoSpeed</option>
                            <option value="PlugNotas">PlugNotas</option>
                            <option value="FocusNFe">FocusNFe</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">API Key / Token</label>
                        <input type="password" name="apiKey" value={data.apiKey} onChange={handleChange} className={inputStyle}/>
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium">API Secret (se aplicável)</label>
                        <input type="password" name="apiSecret" value={data.apiSecret} onChange={handleChange} className={inputStyle}/>
                    </div>
                </div>
            </fieldset>

             <fieldset className="border p-4 rounded-md dark:border-gray-600">
                <legend className="text-md font-semibold px-2">Certificado Digital A1</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Arquivo do Certificado (.pfx)</label>
                        <label htmlFor="cert-upload" className="flex items-center justify-center w-full px-4 py-6 text-center border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 hover:border-theme-primary dark:hover:border-theme-primary transition-colors cursor-pointer">
                            <div className="text-center">
                                <UploadCloud className="w-8 h-8 mx-auto text-gray-400 mb-2"/>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {certificateName ? `Arquivo: ${certificateName}` : 'Clique para selecionar o arquivo'}
                                </span>
                                <p className="text-xs text-gray-500">Formato .pfx</p>
                            </div>
                            <input id="cert-upload" type="file" accept=".pfx" onChange={handleFileChange} className="hidden"/>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Senha do Certificado</label>
                        <input type="password" name="certificatePassword" className={inputStyle}/>
                    </div>
                </div>
            </fieldset>

        </div>
    );
};

export default FormApiCertificado;
