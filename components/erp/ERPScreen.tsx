
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, BarChart, FileText, Boxes, ChevronDown, ChevronUp, ArrowLeft, BrainCircuit, Landmark, Wallet, FileCode, MapPin, Settings2, Truck, Circle, ShieldCheck, UserPlus } from 'lucide-react';
import { db } from '../../services/databaseService';
import { useAuth } from '../../App';
import type { Category } from '../../types';
import Button from '../shared/Button';

import ProductManagement from './ProductManagement';
import CategoryManagement from './CategoryManagement';
import NFeImport from './NFeImport';
import InventoryReport from './InventoryReport';
import CustomerManagement from './CustomerManagement';
import ProductFormPage from './ProductFormPage';
import CustomerFormPage from './CustomerFormPage'; 
import CategoryFormPage from './CategoryFormPage'; 
import GenerateOrder from './GenerateOrder'; 
import ExpenseManagement from './ExpenseManagement';
import ExpenseFormPage from './ExpenseFormPage';
import DREDashboard from './DREDashboard';
import HRManagement from './HRManagement';
import EmployeeFormPage from './EmployeeFormPage';
import CashAudit from './CashAudit';
import DeliveryZones from './DeliveryZones';
import GeneralSettings from './GeneralSettings';
import ValidityAlertBanner from './ValidityAlertBanner';
import SupplierManagement from './SupplierManagement';
import SupplierFormPage from './SupplierFormPage';
import UserManagement from './UserManagement';
import UserFormPage from './UserFormPage';

interface ERPScreenProps {
    setView: (view: 'pos' | 'erp' | 'crm' | 'fiscal') => void;
}

type ActiveModule = 'products' | 'categories' | 'customers' | 'suppliers' | 'financial' | 'expenses' | 'reports' | 'nfeImport' | 'inventory' | 'generateOrder' | 'dre' | 'hr' | 'cashAudit' | 'deliveryZones' | 'generalSettings' | 'users';

type ERPView = 
  | { type: 'module', id: ActiveModule }
  | { type: 'product_form', productId?: string }
  | { type: 'customer_form', customerId?: string }
  | { type: 'category_form', categoryId?: string }
  | { type: 'expense_form', expenseId?: string }
  | { type: 'supplier_form', supplierId?: string }
  | { type: 'employee_form', employeeId?: string }
  | { type: 'user_form', userId?: string };


interface MenuItem { id: ActiveModule; label: string; }
interface MenuModule { id: string; label: string; icon: React.ElementType; items: MenuItem[]; color: string; adminOnly?: boolean; }

const menuModules: MenuModule[] = [
    {
        id: 'estrategico',
        label: 'Gestão Estratégica',
        icon: BrainCircuit,
        color: 'text-purple-500',
        items: [
            { id: 'dre', label: 'Painel DRE / Lucro' },
            { id: 'cashAudit', label: 'Controle de Caixa' },
            { id: 'hr', label: 'Equipe e RH' },
        ],
    },
    {
        id: 'seguranca',
        label: 'Sistema e Acessos',
        icon: ShieldCheck,
        color: 'text-red-500',
        adminOnly: true,
        items: [
            { id: 'users', label: 'Usuários e Permissões' },
            { id: 'generalSettings', label: 'Backup eWhatsApp' },
        ],
    },
    {
        id: 'estoque',
        label: 'Estoque',
        icon: Boxes,
        color: 'text-blue-500',
        items: [
            { id: 'products', label: 'Produtos' },
            { id: 'categories', label: 'Categorias' },
            { id: 'inventory', label: 'Inventário e Validade' },
        ],
    },
    {
        id: 'financeiro',
        label: 'Financeiro',
        icon: BarChart,
        color: 'text-theme-secondary',
        items: [
            { id: 'expenses', label: 'Contas a Pagar' },
            { id: 'suppliers', label: 'Fornecedores (Credores)' },
        ],
    },
    {
        id: 'compras',
        label: 'Compras',
        icon: ShoppingCart,
        color: 'text-theme-primary',
        items: [
            { id: 'generateOrder', label: 'Sugestão de Pedidos' },
            { id: 'nfeImport', label: 'Importar NF-e XML' },
        ],
    },
    {
        id: 'clientes',
        label: 'Clientes',
        icon: Users,
        color: 'text-teal-500',
        items: [ { id: 'customers', label: 'Base de Clientes' } ],
    },
    {
        id: 'configuracoes',
        label: 'Logística',
        icon: Settings2,
        color: 'text-gray-500',
        items: [
            { id: 'deliveryZones', label: 'Bairros e Fretes' },
        ],
    },
];

const ERPScreen: React.FC<ERPScreenProps> = ({ setView }) => {
    const { user: currentUser } = useAuth();
    const [currentErpView, setCurrentErpView] = useState<ERPView>({ type: 'module', id: 'dre' }); 
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['estrategico', 'seguranca', 'estoque']));
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        db.getAll('categories').then(cats => setCategories(cats.sort((a,b) => a.name.localeCompare(b.name))));
    }, []);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) newSet.delete(sectionId);
            else newSet.add(sectionId);
            return newSet;
        });
    };

    const renderActiveModule = () => {
        switch(currentErpView.type) {
            case 'product_form': return <ProductFormPage productId={currentErpView.productId} categories={categories} onBack={() => setCurrentErpView({ type: 'module', id: 'products' })} />;
            case 'customer_form': return <CustomerFormPage customerId={currentErpView.customerId} onBack={() => setCurrentErpView({ type: 'module', id: 'customers' })} />;
            case 'category_form': return <CategoryFormPage categoryId={currentErpView.categoryId} onBack={() => setCurrentErpView({ type: 'module', id: 'categories' })} />;
            case 'expense_form': return <ExpenseFormPage expenseId={currentErpView.expenseId} onBack={() => setCurrentErpView({ type: 'module', id: 'expenses' })} />;
            case 'supplier_form': return <SupplierFormPage supplierId={currentErpView.supplierId} onBack={() => setCurrentErpView({ type: 'module', id: 'suppliers' })} />;
            case 'employee_form': return <EmployeeFormPage employeeId={currentErpView.employeeId} onBack={() => setCurrentErpView({ type: 'module', id: 'hr' })} />;
            case 'user_form': return <UserFormPage userId={currentErpView.userId} onBack={() => setCurrentErpView({ type: 'module', id: 'users' })} />;
            case 'module':
                switch(currentErpView.id) {
                    case 'dre': return <DREDashboard />;
                    case 'hr': return <HRManagement onNewEmployee={() => setCurrentErpView({ type: 'employee_form' })} onEditEmployee={(id) => setCurrentErpView({ type: 'employee_form', employeeId: id })} />;
                    case 'users': return <UserManagement onNewUser={() => setCurrentErpView({ type: 'user_form' })} onEditUser={(id) => setCurrentErpView({ type: 'user_form', userId: id })} />;
                    case 'cashAudit': return <CashAudit />;
                    case 'deliveryZones': return <DeliveryZones />;
                    case 'generalSettings': return <GeneralSettings />;
                    case 'products': return <ProductManagement onNewProduct={() => setCurrentErpView({ type: 'product_form' })} onEditProduct={(id) => setCurrentErpView({ type: 'product_form', productId: id })} onImportXML={() => setCurrentErpView({ type: 'module', id: 'nfeImport' })} />;
                    case 'categories': return <CategoryManagement onNewCategory={() => setCurrentErpView({ type: 'category_form' })} onEditCategory={(id) => setCurrentErpView({ type: 'category_form', categoryId: id })} />;
                    case 'customers': return <CustomerManagement onNewCustomer={() => setCurrentErpView({ type: 'customer_form' })} onEditCustomer={(id) => setCurrentErpView({ type: 'customer_form', customerId: id })} />;
                    case 'suppliers': return <SupplierManagement onNewSupplier={() => setCurrentErpView({ type: 'supplier_form' })} onEditSupplier={(id) => setCurrentErpView({ type: 'supplier_form', supplierId: id })} />;
                    case 'expenses': return <ExpenseManagement onNewExpense={() => setCurrentErpView({ type: 'expense_form' })} onEditExpense={(id) => setCurrentErpView({ type: 'expense_form', expenseId: id })} />;
                    case 'nfeImport': return <NFeImport />;
                    case 'generateOrder': return <GenerateOrder />;
                    case 'inventory': return <InventoryReport />;
                    default: return <div className="p-8">Módulo em construção</div>;
                }
        }
    };

    const getHeaderInfo = () => {
        if (currentErpView.type === 'module') {
            const label = menuModules.flatMap(m => m.items).find(i => i.id === currentErpView.id)?.label || 'Dashboard';
            return { title: label, activeModule: currentErpView.id, backAction: null as (() => void) | null };
        }
        
        switch(currentErpView.type) {
            case 'product_form': return { title: 'Editar Produto', activeModule: 'products' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'products' }) };
            case 'customer_form': return { title: 'Editar Cliente', activeModule: 'customers' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'customers' }) };
            case 'category_form': return { title: 'Editar Categoria', activeModule: 'categories' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'categories' }) };
            case 'expense_form': return { title: 'Editar Despesa', activeModule: 'expenses' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'expenses' }) };
            case 'supplier_form': return { title: 'Editar Fornecedor', activeModule: 'suppliers' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'suppliers' }) };
            case 'employee_form': return { title: 'Ficha do Colaborador', activeModule: 'hr' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'hr' }) };
            case 'user_form': return { title: 'Configurar Operador', activeModule: 'users' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'users' }) };
            default: return { title: 'ERP', activeModule: 'dre' as ActiveModule, backAction: null as (() => void) | null };
        }
    };
    const { title, activeModule, backAction } = getHeaderInfo();

    return (
        <div className="flex flex-col md:flex-row h-full bg-gray-100 dark:bg-gray-900">
            <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-md md:shadow-none md:border-r dark:border-gray-700 flex flex-col order-1 shrink-0 overflow-y-auto">
                <div className="hidden md:block p-6 border-b dark:border-gray-700">
                    <h1 className="text-xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Gestão BI</h1>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-theme-primary animate-pulse"></span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sessão Ativa</span>
                    </div>
                </div>

                <nav className="flex-grow p-3 space-y-1">
                    {menuModules.filter(m => !m.adminOnly || currentUser?.role === 'ADMIN').map(module => {
                        const isExpanded = expandedSections.has(module.id);
                        const hasActiveChild = module.items.some(i => i.id === activeModule);
                        
                        return (
                            <div key={module.id} className="flex flex-col mb-2">
                                <button 
                                    onClick={() => toggleSection(module.id)} 
                                    className={`flex items-center justify-between w-full gap-3 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${hasActiveChild ? 'text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700/30' : 'text-gray-400 hover:text-theme-primary'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <module.icon className={`w-4 h-4 ${hasActiveChild ? module.color : 'text-gray-400'}`} />
                                        <span>{module.label}</span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>

                                <div className={`flex flex-col gap-1 mt-1 relative ml-4 ${!isExpanded ? 'hidden' : ''}`}>
                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700 ml-1.5"></div>
                                    {module.items.map(item => {
                                        const isActive = activeModule === item.id;
                                        return (
                                            <a 
                                                key={item.id} 
                                                href="#" 
                                                onClick={(e) => { e.preventDefault(); setCurrentErpView({ type: 'module', id: item.id }); }} 
                                                className={`group flex items-center justify-between pl-6 pr-3 py-2 rounded-lg text-xs font-bold transition-all relative ${isActive ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20 translate-x-1' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-400 hover:translate-x-1'}`}
                                            >
                                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full ml-1 animate-in fade-in zoom-in"></div>}
                                                <span>{item.label}</span>
                                                {isActive && <Circle size={4} fill="white" className="opacity-50" />}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="p-4 border-t dark:border-gray-700 mt-auto">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Operador Logado</p>
                        <p className="text-[10px] font-bold text-theme-primary uppercase">{currentUser?.username}</p>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden order-2 h-full">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-4 shrink-0">
                    {backAction && (
                        <button 
                            onClick={backAction} 
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-theme-primary"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 capitalize truncate tracking-tight">
                            {title}
                        </h2>
                        {currentErpView.type === 'module' && (
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] hidden md:block">
                                Gestão Bem Estar / Módulo {menuModules.find(m => m.items.some(i => i.id === activeModule))?.label}
                            </p>
                        )}
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {activeModule === 'dre' && <ValidityAlertBanner onAction={() => setCurrentErpView({ type: 'module', id: 'inventory' })} />}
                    {renderActiveModule()}
                </div>
            </main>
        </div>
    );
};

export default ERPScreen;
