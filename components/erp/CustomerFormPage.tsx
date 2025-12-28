
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Customer } from '../../types';
import Button from '../shared/Button';
import { Save, User, Phone, MapPin, Instagram, FileText, CreditCard } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CustomerFormPageProps {
  customerId?: string;
  onBack: () => void;
}

const CustomerFormPage: React.FC<CustomerFormPageProps> = ({ customerId, onBack }) => {
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            if (customerId) {
                const customer = await db.get('customers', customerId);
                if (customer) {
                    setFormData(customer);
                } else {
                    onBack();
                }
            } else {
                setFormData({
                    id: uuidv4(),
                    name: '',
                    cpf: '',
                    phone: '',
                    cellphone: '',
                    email: '',
                    address: '',
                    socialMedia: '',
                    observations: '',
                    creditLimit: 0,
                });
            }
            setIsLoading(false);
        };
        fetchData();
    }, [customerId, onBack]);

    const formatCurrencyInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        const numberValue = parseInt(digits || '0', 10) / 100;
        return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'creditLimit') {
            const formatted = formatCurrencyInput(value);
            const numericValue = parseFloat(formatted.replace(/\./g, '').replace(',', '.'));
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return alert('O nome é obrigatório.');
        await db.put('customers', formData as Customer);
        onBack();
    };

    if (isLoading) return <div className="text-center p-12 text-gray-500">Carregando ficha do cliente...</div>;

    const inputStyle = "mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-theme-primary focus:ring-theme-primary dark:border-gray-600 dark:bg-gray-700 p-2.5 border transition-all";

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* IDENTIFICAÇÃO */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-2 text-theme-primary font-bold border-b pb-2">
                        <User size={20}/>
                        <span>Identificação</span>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">Nome Completo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">CPF / Documento</label>
                        <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">Limite de Crédito (Notinha)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                            <input 
                                type="text" 
                                name="creditLimit" 
                                value={formData.creditLimit?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                                onChange={handleChange} 
                                className={inputStyle + " pl-10 font-mono"} 
                            />
                        </div>
                    </div>
                </div>

                {/* CONTATO */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-2 text-theme-primary font-bold border-b pb-2">
                        <Phone size={20}/>
                        <span>Canais de Contato</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase">Celular (WhatsApp)</label>
                            <input type="text" name="cellphone" value={formData.cellphone} onChange={handleChange} placeholder="(00) 90000-0000" className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase">Telefone Fixo</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">E-mail</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">Instagram / Redes Sociais</label>
                        <div className="relative">
                            <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input type="text" name="socialMedia" value={formData.socialMedia} onChange={handleChange} placeholder="@seu_perfil" className={inputStyle + " pl-10"} />
                        </div>
                    </div>
                </div>

                {/* ENDEREÇO E OBS */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-2 text-theme-primary font-bold border-b pb-2">
                        <MapPin size={20}/>
                        <span>Localização e Notas</span>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase">Endereço Completo</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                            <FileText size={12}/> Observações Internas
                        </label>
                        <textarea name="observations" value={formData.observations} onChange={handleChange} rows={3} className={inputStyle}></textarea>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={onBack}>Descartar</Button>
                    <Button type="submit" variant="primary" className="px-10">
                        <Save size={18} className="mr-2" /> Salvar Cliente
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default CustomerFormPage;
