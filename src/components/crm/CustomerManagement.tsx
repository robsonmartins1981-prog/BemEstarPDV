
import React, { useState, useEffect } from 'react';
import { db } from '../../services/databaseService';
import type { Customer, Sale } from '../../types';
import { formatCurrency } from '../../utils/formatUtils';
import { safeLocaleDateString } from '../../utils/dateUtils';
import Button from '../shared/Button';
import { 
  Users, Plus, Edit, Trash2, Search, Tag, Filter, 
  History, UserCircle, Phone, Mail, MapPin, Calendar,
  ChevronRight, ChevronDown, ShoppingBag, X
} from 'lucide-react';

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    address: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await db.getAll('customers');
      setCustomers(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerToSave = {
        ...formData,
        id: editingCustomer?.id || crypto.randomUUID(),
      } as Customer;

      await db.put('customers', customerToSave);
      setIsFormOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', cpf: '', phone: '', email: '', address: '', tags: [] });
      fetchCustomers();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await db.delete('customers', id);
      fetchCustomers();
    }
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsFormOpen(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove) || []
    }));
  };

  const viewHistory = async (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    const allSales = await db.getAll('sales');
    const filteredSales = allSales.filter(s => s.customerId === customer.id || s.customerCPF === customer.cpf);
    setCustomerSales(filteredSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const allTags = Array.from(new Set(customers.flatMap(c => c.tags || [])));

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.cpf.includes(searchTerm) ||
                         (c.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = !selectedTag || c.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Gestão de Clientes</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">CRM e Segmentação por Nicho</p>
        </div>
        <Button onClick={() => { setEditingCustomer(null); setFormData({ name: '', cpf: '', phone: '', email: '', address: '', tags: [] }); setIsFormOpen(true); }}>
          <Plus size={20} className="mr-2" /> Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou e-mail..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl outline-none focus:border-theme-primary transition-all text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Filter size={18} className="text-gray-400 shrink-0" />
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${!selectedTag ? 'bg-theme-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
          >
            Todos
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${selectedTag === tag ? 'bg-theme-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                    <UserCircle size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 dark:text-white uppercase text-sm leading-tight">{customer.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CPF: {customer.cpf}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(customer)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-blue-500 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Phone size={14} />
                    <span className="font-bold">{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Mail size={14} />
                    <span className="font-bold truncate">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin size={14} />
                    <span className="font-bold truncate">{customer.address}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {customer.tags?.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-md">
                    {tag}
                  </span>
                ))}
                {(!customer.tags || customer.tags.length === 0) && (
                  <span className="text-[9px] font-bold text-gray-300 uppercase italic">Sem tags</span>
                )}
              </div>

              <button 
                onClick={() => viewHistory(customer)}
                className="w-full py-2.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-theme-primary/10 hover:text-theme-primary text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <History size={14} />
                Painel Fidelidade
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                  {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Informações Cadastrais</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">CPF</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                      value={formData.cpf}
                      onChange={e => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">E-mail</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                      value={formData.email}
                      onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Endereço</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Tags / Segmentação</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Vegano"
                        className="flex-grow px-4 py-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary font-bold text-sm"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <button type="button" onClick={addTag} className="p-3 bg-theme-primary text-white rounded-2xl hover:bg-theme-primary/90 transition-colors">
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.tags?.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-theme-primary/10 text-theme-primary text-[9px] font-black uppercase tracking-widest rounded-md">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="secondary" className="flex-1" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1">Salvar Cliente</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fidelity Panel / History Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[80vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
            <div className="p-8 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                  <History size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Painel Fidelidade</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedCustomerForHistory.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomerForHistory(null)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Comprado</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(customerSales.reduce((acc, s) => acc + s.totalAmount, 0))}
                  </p>
                </div>
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Frequência</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{customerSales.length} Compras</p>
                </div>
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-800/30">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Ticket Médio</p>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {formatCurrency(customerSales.length > 0 ? customerSales.reduce((acc, s) => acc + s.totalAmount, 0) / customerSales.length : 0)}
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Histórico de Compras</h4>
              <div className="space-y-4">
                {customerSales.map(sale => (
                  <div key={sale.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                          <ShoppingBag size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{safeLocaleDateString(sale.date)}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Venda #{sale.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <p className="text-lg font-black text-theme-primary">{formatCurrency(sale.totalAmount)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sale.items.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-500 rounded-lg">
                          {item.quantity}x {item.productName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {customerSales.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase text-sm">Nenhuma compra registrada</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
