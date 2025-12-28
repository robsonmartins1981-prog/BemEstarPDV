
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, BarChart, FileText, Boxes, ChevronDown, ChevronUp, ArrowLeft, BrainCircuit, UserCog } from 'lucide-react';
import { db } from '../../services/databaseService';
import type { Category } from '../../types';
import Button from '../shared/Button';

// Importa os componentes de cada módulo do ERP usando caminhos relativos consistentes
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

interface ERPScreenProps {
    setView: (view: 'pos' | 'erp' | 'crm' | 'fiscal') => void;
}

type ActiveModule = 'products' | 'categories' | 'customers' | 'financial' | 'expenses' | 'reports' | 'nfeImport' | 'inventory' | 'generateOrder' | 'dre' | 'hr';

type ERPView = 
  | { type: 'module', id: ActiveModule }
  | { type: 'product_form', productId?: string }
  | { type: 'customer_form', customerId?: string }
  | { type: 'category_form', categoryId?: string }
  | { type: 'expense_form', expenseId?: string };


interface MenuItem { id: ActiveModule; label: string; }
interface MenuModule { id: string; label: string; icon: React.ElementType; items: MenuItem[]; }

const menuModules: MenuModule[] = [
    {
        id: 'estrategico',
        label: 'Gestão Estratégica',
        icon: BrainCircuit,
        items: [
            { id: 'dre', label: 'Painel DRE / Lucro' },
            { id: 'hr', label: 'Equipe e RH' },
        ],
    },
    {
        id: 'estoque',
        label: 'Estoque',
        icon: Boxes,
        items: [
            { id: 'products', label: 'Produtos' },
            { id: 'categories', label: 'Categorias' },
            { id: 'inventory', label: 'Inventário' },
        ],
    },
    {
        id: 'compras',
        label: 'Compras',
        icon: ShoppingCart,
        items: [
            { id: 'generateOrder', label: 'Pedidos' },
            { id: 'nfeImport', label: 'Importar NF-e' },
        ],
    },
    {
        id: 'clientes',
        label: 'Clientes',
        icon: Users,
        items: [ { id: 'customers', label: 'Clientes' } ],
    },
    {
        id: 'financeiro',
        label: 'Financeiro',
        icon: BarChart,
        items: [
            { id: 'expenses', label: 'Contas a Pagar' },
        ],
    },
];

const ERPScreen: React.FC<ERPScreenProps> = ({ setView }) => {
    const [currentErpView, setCurrentErpView] = useState<ERPView>({ type: 'module', id: 'dre' }); 
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['estrategico', 'estoque', 'financeiro']));
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
            case 'module':
                switch(currentErpView.id) {
                    case 'dre': return <DREDashboard />;
                    case 'hr': return <HRManagement />;
                    case 'products': return <ProductManagement onNewProduct={() => setCurrentErpView({ type: 'product_form' })} onEditProduct={(id) => setCurrentErpView({ type: 'product_form', productId: id })} />;
                    case 'categories': return <CategoryManagement onNewCategory={() => setCurrentErpView({ type: 'category_form' })} onEditCategory={(id) => setCurrentErpView({ type: 'category_form', categoryId: id })} />;
                    case 'customers': return <CustomerManagement onNewCustomer={() => setCurrentErpView({ type: 'customer_form' })} onEditCustomer={(id) => setCurrentErpView({ type: 'customer_form', customerId: id })} />;
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
            case 'product_form': 
                return { title: 'Editar Produto', activeModule: 'products' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'products' }) };
            case 'customer_form': 
                return { title: 'Editar Cliente', activeModule: 'customers' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'customers' }) };
            case 'category_form': 
                return { title: 'Editar Categoria', activeModule: 'categories' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'categories' }) };
            case 'expense_form': 
                return { title: 'Editar Despesa', activeModule: 'expenses' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'expenses' }) };
            default:
                return { title: 'ERP', activeModule: 'dre' as ActiveModule, backAction: null as (() => void) | null };
        }
    };
    const { title, activeModule, backAction } = getHeaderInfo();

    return (
        <div className="flex flex-col md:flex-row h-full bg-gray-100 dark:bg-gray-900">
            <aside className="w-full md:w-64 bg-white dark:bg-gray-800 shadow-md md:shadow-none md:border-r dark:border-gray-700 flex flex-col order-1">
                <div className="hidden md:block p-4 border-b dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tighter">Gestão BI</h1>
                    <span className="text-[10px] font-black text-theme-primary">USENATURAL v2.0</span>
                </div>
                <nav className="flex-grow md:p-2 overflow-x-auto md:overflow-y-auto whitespace-nowrap md:whitespace-normal">
                    <ul className="flex md:flex-col p-2 md:p-0 gap-2 md:gap-1 items-center md:items-stretch">
                        {menuModules.map(module => {
                            const isExpanded = expandedSections.has(module.id);
                            return (
                                <li key={module.id} className="inline-flex md:block md:flex-col">
                                    <button onClick={() => toggleSection(module.id)} className="hidden md:flex items-center justify-between w-full gap-3 px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest text-gray-400 hover:text-theme-primary transition-all">
                                        <div className="flex items-center gap-3"><module.icon className="w-4 h-4" /><span>{module.label}</span></div>
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    <ul className={`flex flex-row md:flex-col gap-2 md:gap-1 md:pl-6 md:mt-1 ${!isExpanded ? 'md:hidden' : 'md:block'}`}>
                                        {module.items.map(item => (
                                            <li key={item.id} className="inline-block md:block">
                                                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentErpView({ type: 'module', id: item.id }); }} 
                                                    className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-xl text-sm font-bold transition-all border md:border-0 ${activeModule === item.id ? 'bg-theme-primary text-white shadow-lg' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                    <span>{item.label}</span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden order-2 h-full">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-4 shrink-0">
                    {backAction && <Button variant="secondary" onClick={backAction} className="!py-2 !px-3"><ArrowLeft size={16} className="mr-2"/> Voltar</Button>}
                    <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 capitalize truncate tracking-tight">{title}</h2>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6">{renderActiveModule()}</div>
            </main>
        </div>
    );
};

export default ERPScreen;
