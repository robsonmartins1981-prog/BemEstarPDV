
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../../services/databaseService';
import type { Customer } from '../../types';
import Button from '../shared/Button';
import { PlusCircle, Edit, Trash2, Search, Download, Upload, FileText, Users, Instagram, Phone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CustomerManagementProps {
    onNewCustomer: () => void;
    onEditCustomer: (customerId: string) => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({ onNewCustomer, onEditCustomer }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchCustomers = useCallback(async () => {
        const allCustomers = await db.getAll('customers');
        setCustomers(allCustomers.sort((a,b) => a.name.localeCompare(b.name)));
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            await db.delete('customers', id);
            fetchCustomers();
        }
    };

    const processCSV = (text: string): Customer[] => {
        const rows = text.split(/\r?\n/);
        if (rows.length < 2) return [];

        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        const imported: Customer[] = [];

        for (let i = 1; i < rows.length; i++) {
            const currentLine = rows[i].split(',');
            if (currentLine.length < headers.length || !currentLine[0]) continue;

            const getVal = (possibleHeaders: string[]) => {
                const index = headers.findIndex(h => possibleHeaders.includes(h));
                return index !== -1 ? currentLine[index].trim().replace(/^"|"$/g, '') : '';
            };

            imported.push({
                id: uuidv4(),
                name: getVal(['nome', 'name', 'first name', 'display name']),
                cpf: getVal(['cpf', 'documento', 'tax id']),
                phone: getVal(['telefone', 'phone', 'tel', 'fixo']),
                cellphone: getVal(['celular', 'mobile', 'whatsapp', 'cell', 'cellphone']),
                email: getVal(['email', 'e-mail', 'mail']),
                address: getVal(['endereco', 'address', 'logradouro']),
                socialMedia: getVal(['social', 'instagram', 'insta', 'redes sociais']),
                observations: getVal(['obs', 'observacoes', 'notes', 'note']),
                creditLimit: 0
            });
        }
        return imported;
    };

    const processVCF = (text: string): Customer[] => {
        const vcardBlocks = text.split(/END:VCARD/i);
        const imported: Customer[] = [];

        vcardBlocks.forEach(block => {
            if (!block.includes('BEGIN:VCARD')) return;
            
            const lines = block.split(/\r?\n/);
            let name = '', phone = '', cellphone = '', email = '', address = '';
            
            lines.forEach(line => {
                const [key, ...valParts] = line.split(':');
                const val = valParts.join(':').trim();
                if (!val) return;

                const upperKey = key.toUpperCase();

                if (upperKey.startsWith('FN')) {
                    name = val;
                } else if (upperKey.startsWith('N') && !name) {
                    name = val.split(';').filter(Boolean).reverse().join(' ');
                } else if (upperKey.startsWith('TEL')) {
                    if (upperKey.includes('CELL') || upperKey.includes('WA')) {
                        cellphone = val;
                    } else {
                        phone = val;
                    }
                } else if (upperKey.startsWith('EMAIL')) {
                    email = val;
                } else if (upperKey.startsWith('ADR')) {
                    address = val.replace(/;/g, ' ').trim();
                }
            });

            if (name) {
                imported.push({
                    id: uuidv4(),
                    name,
                    cpf: '',
                    phone,
                    cellphone,
                    email,
                    address,
                    socialMedia: '',
                    observations: 'Importado via vCard (.vcf)',
                    creditLimit: 0
                });
            }
        });
        return imported;
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        const extension = file.name.split('.').pop()?.toLowerCase();

        reader.onload = async (event) => {
            const text = event.target?.result as string;
            let importedCustomers: Customer[] = [];

            if (extension === 'vcf') {
                importedCustomers = processVCF(text);
            } else if (extension === 'csv') {
                importedCustomers = processCSV(text);
            } else {
                return alert('Formato de arquivo não suportado. Use .csv ou .vcf');
            }

            if (importedCustomers.length > 0) {
                const tx = db.transaction('customers', 'readwrite');
                for (const customer of importedCustomers) {
                    await tx.store.put(customer);
                }
                await tx.done;
                alert(`${importedCustomers.length} clientes importados com sucesso!`);
                fetchCustomers();
            } else {
                alert('Nenhum contato válido encontrado no arquivo.');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleExportCSV = () => {
        if (customers.length === 0) return alert('Não há dados para exportar.');
        const headers = ['Nome', 'CPF', 'Telefone', 'Celular', 'Email', 'Endereco', 'Social', 'Observacoes'];
        const csvContent = [
            headers.join(','),
            ...customers.map(c => [
                `"${c.name}"`, `"${c.cpf}"`, `"${c.phone || ''}"`, `"${c.cellphone || ''}"`,
                `"${c.email || ''}"`, `"${c.address || ''}"`, `"${c.socialMedia || ''}"`, `"${c.observations || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clientes_bemestar_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf.includes(searchTerm) ||
        c.cellphone?.includes(searchTerm)
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input
                        type="text"
                        placeholder="Nome, CPF ou Celular..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-theme-primary outline-none"
                    />
                </div>
                
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <input type="file" accept=".csv,.vcf" ref={fileInputRef} className="hidden" onChange={handleImportFile} />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={18}/> Importar (CSV/VCF)
                    </Button>
                    <Button variant="secondary" onClick={handleExportCSV}>
                        <Download size={18}/> Exportar
                    </Button>
                    <Button onClick={onNewCustomer}>
                        <PlusCircle size={18}/> Novo Cliente
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Contato Principal</th>
                            <th className="px-6 py-4">Redes / Social</th>
                            <th className="px-6 py-4">Documento</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-600/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800 dark:text-gray-100">{customer.name}</span>
                                        <span className="text-[10px] text-gray-400 uppercase truncate max-w-[200px]">{customer.observations || 'Sem observações'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-theme-primary">
                                            <Phone size={12}/>
                                            <span className="font-mono">{customer.cellphone || customer.phone || 'N/A'}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{customer.email || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {customer.socialMedia ? (
                                        <div className="flex items-center gap-1 text-theme-secondary font-medium">
                                            <Instagram size={14}/>
                                            <span>{customer.socialMedia}</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-500">{customer.cpf || 'Não informado'}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button variant="secondary" className="p-2 h-auto" onClick={() => onEditCustomer(customer.id)}><Edit size={16}/></Button>
                                        <Button variant="danger" className="p-2 h-auto" onClick={() => handleDelete(customer.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                    <div className="text-center p-12 text-gray-400">
                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Nenhum cliente encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerManagement;
