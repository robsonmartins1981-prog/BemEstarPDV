
import React from 'react';
import type { EmitenteConfig } from '../../../../types';

interface FormEmitenteProps {
    data: EmitenteConfig;
    onChange: (data: EmitenteConfig) => void;
}

const FormEmitente: React.FC<FormEmitenteProps> = ({ data, onChange }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange({
            ...data,
            [e.target.name]: e.target.value,
        });
    };
    
    // Adicionado 'text-base' para evitar zoom no iPhone ao focar
    const inputStyle = "mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:border-theme-primary focus:ring-theme-primary text-base md:text-sm py-2";
    
    return (
        <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* CNPJ */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium">CNPJ</label>
                    <input type="text" name="cnpj" value={data.cnpj} onChange={handleChange} className={inputStyle} placeholder="00.000.000/0001-00"/>
                </div>
                {/* Inscrição Estadual */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium">Inscrição Estadual</label>
                    <input type="text" name="inscricaoEstadual" value={data.inscricaoEstadual} onChange={handleChange} className={inputStyle} />
                </div>
                {/* Razão Social */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Razão Social</label>
                    <input type="text" name="razaoSocial" value={data.razaoSocial} onChange={handleChange} className={inputStyle} />
                </div>
                {/* Nome Fantasia */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Nome Fantasia</label>
                    <input type="text" name="nomeFantasia" value={data.nomeFantasia} onChange={handleChange} className={inputStyle} />
                </div>

                {/* Endereço */}
                 <div className="md:col-span-2 border-t pt-4 mt-2 dark:border-gray-600 grid grid-cols-1 md:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-4">
                    <div className="col-span-1 md:col-span-4">
                        <label className="block text-sm font-medium">Logradouro (Rua, Av.)</label>
                        <input type="text" name="logradouro" value={data.logradouro} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium">Número</label>
                        <input type="text" name="numero" value={data.numero} onChange={handleChange} className={inputStyle} />
                    </div>
                     <div className="col-span-1 md:col-span-3">
                        <label className="block text-sm font-medium">Bairro</label>
                        <input type="text" name="bairro" value={data.bairro} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label className="block text-sm font-medium">CEP</label>
                        <input type="text" name="cep" value={data.cep} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label className="block text-sm font-medium">Cidade</label>
                        <input type="text" name="cidade" value={data.cidade} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <label className="block text-sm font-medium">UF</label>
                        <input type="text" name="uf" value={data.uf} onChange={handleChange} maxLength={2} className={inputStyle} />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium">Cód. IBGE Cidade</label>
                        <input type="text" name="codigoIbgeCidade" value={data.codigoIbgeCidade} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>

                {/* Regime Tributário */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Regime Tributário</label>
                    <select name="regimeTributario" value={data.regimeTributario} onChange={handleChange} className={inputStyle}>
                        <option value="SimplesNacional">Simples Nacional</option>
                        <option value="LucroPresumido">Lucro Presumido</option>
                        <option value="LucroReal">Lucro Real</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FormEmitente;
