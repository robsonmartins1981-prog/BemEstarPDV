
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Supplier } from '../../types';
import Button from '../shared/Button';
import { Save, Truck, Building, User, Phone, Mail, MapPin, Hash } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface SupplierFormPageProps {
  supplierId?: string;
  onBack: () => void;
}

const SupplierFormPage: React.FC<SupplierFormPageProps> = ({ supplierId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSupplier = async () => {
            if (supplierId) {
                const data = await db.get('suppliers', supplierId);
                if (data) setFormData(data);
            } else {
                setFormData({
                    id: uuidv4(),
                    name: '',
                    cnpj: '',
                    contactPerson: '',
                    phone: '',
                    email: ''
                });
            }
            setIsLoading(false);
        };
        fetchSupplier();
    }, [supplierId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.cnpj) {
            alert('Nome e CNPJ são campos obrigatórios.');
            return;
        }

        await db.put('suppliers', formData as Supplier);
        onBack();
    };

    if (isLoading) return <div className="text-center p-12 animate-pulse text-gray-400 uppercase font-black text-xs">Carregando formulário...</div>;

    const inputStyle = "mt-1 block w-full rounded-xl border border-gray-200 py-3 px-4 shadow-sm focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/20 dark:border-gray-700 dark:bg-gray-800 transition-all outline-none";

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-8 text-theme-primary">
                    <div className="p-3 bg-theme-primary/10 rounded-2xl">
                        <Truck size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-gray-100">Ficha do Fornecedor</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gestão de Compras e Suprimentos</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                <Building size={12}/> Razão Social / Nome de Fantasia
                            </label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name || ''} 
                                onChange={handleChange} 
                                required 
                                className={inputStyle} 
                                placeholder="Ex: DISTRIBUIDORA DE PRODUTOS NATURAIS LTDA"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                <Hash size={12}/> CNPJ
                            </label>
                            <input 
                                type="text" 
                                name="cnpj" 
                                value={formData.cnpj || ''} 
                                onChange={handleChange} 
                                required 
                                className={inputStyle + " font-mono"} 
                                placeholder="00.000.000/0000-00"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                <User size={12}/> Pessoa de Contato / Vendedor
                            </label>
                            <input 
                                type="text" 
                                name="contactPerson" 
                                value={formData.contactPerson || ''} 
                                onChange={handleChange} 
                                className={inputStyle} 
                                placeholder="Ex: João da Distribuidora"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                <Phone size={12}/> Telefone / WhatsApp
                            </label>
                            <input 
                                type="text" 
                                name="phone" 
                                value={formData.phone || ''} 
                                onChange={handleChange} 
                                className={inputStyle + " font-mono"} 
                                placeholder="(00) 00000-0000"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1 flex items-center gap-1">
                                <Mail size={12}/> E-mail Comercial
                            </label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email || ''} 
                                onChange={handleChange} 
                                className={inputStyle} 
                                placeholder="vendas@fornecedor.com.br"
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t dark:border-gray-700 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onBack} className="px-8 rounded-2xl">Descartar</Button>
                        <Button type="submit" variant="primary" className="px-10 rounded-2xl shadow-lg shadow-theme-primary/30">
                            <Save size={18} className="mr-2"/> Salvar Fornecedor
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierFormPage;
