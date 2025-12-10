
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, BarChart, FileText, Boxes, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { db } from '../../services/databaseService';
import type { Category } from '../../types';
import Button from '../shared/Button';

// Importa os componentes de cada módulo do ERP
import ProductManagement from './ProductManagement';
import CategoryManagement from './CategoryManagement';
import NFeImport from './NFeImport';
import InventoryReport from './InventoryReport';
import CustomerManagement from './CustomerManagement';
import ProductFormPage from './ProductFormPage';
import CustomerFormPage from './CustomerFormPage'; // Importa a nova página
import CategoryFormPage from './CategoryFormPage'; // Importa a nova página
import GenerateOrder from './GenerateOrder'; // Importa o novo módulo

interface ERPScreenProps {
    setView: (view: 'pos' | 'erp' | 'crm' | 'fiscal') => void;
}

type ActiveModule = 'products' | 'categories' | 'customers' | 'suppliers' | 'financial' | 'reports' | 'nfeImport' | 'inventory' | 'generateOrder';

// Novo tipo para controlar a visualização dentro do ERP
type ERPView = 
  | { type: 'module', id: ActiveModule }
  | { type: 'product_form', productId?: string }
  | { type: 'customer_form', customerId?: string }
  | { type: 'category_form', categoryId?: string };


// Estrutura do menu refatorada com módulos agrupados
interface MenuItem {
    id: ActiveModule;
    label: string;
}

interface MenuModule {
    id: string;
    label: string;
    icon: React.ElementType;
    items: MenuItem[];
}

const menuModules: MenuModule[] = [
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
        items: [
            { id: 'customers', label: 'Clientes' },
        ],
    },
    {
        id: 'financeiro',
        label: 'Financeiro',
        icon: BarChart,
        items: [
            { id: 'financial', label: 'Visão Geral' },
        ],
    },
    {
        id: 'relatorios',
        label: 'Relatórios',
        icon: FileText,
        items: [
            { id: 'reports', label: 'Relatórios' },
        ],
    },
];

// Componente principal para a tela de Retaguarda (ERP).
const ERPScreen: React.FC<ERPScreenProps> = ({ setView }) => {
    const [currentErpView, setCurrentErpView] = useState<ERPView>({ type: 'module', id: 'products' });
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['estoque', 'compras']));
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
            case 'product_form':
                return <ProductFormPage 
                    productId={currentErpView.productId} 
                    categories={categories} 
                    onBack={() => setCurrentErpView({ type: 'module', id: 'products' })} 
                />;
            case 'customer_form':
                return <CustomerFormPage 
                    customerId={currentErpView.customerId} 
                    onBack={() => setCurrentErpView({ type: 'module', id: 'customers' })} 
                />;
            case 'category_form':
                return <CategoryFormPage 
                    categoryId={currentErpView.categoryId} 
                    onBack={() => setCurrentErpView({ type: 'module', id: 'categories' })} 
                />;
            case 'module':
                switch(currentErpView.id) {
                    case 'products':
                        return <ProductManagement 
                            onNewProduct={() => setCurrentErpView({ type: 'product_form' })}
                            onEditProduct={(id) => setCurrentErpView({ type: 'product_form', productId: id })}
                        />;
                    case 'categories':
                        return <CategoryManagement 
                            onNewCategory={() => setCurrentErpView({ type: 'category_form' })}
                            onEditCategory={(id) => setCurrentErpView({ type: 'category_form', categoryId: id })}
                        />;
                    case 'customers':
                        return <CustomerManagement 
                            onNewCustomer={() => setCurrentErpView({ type: 'customer_form' })}
                            onEditCustomer={(id) => setCurrentErpView({ type: 'customer_form', customerId: id })}
                        />;
                    case 'nfeImport': return <NFeImport />;
                    case 'generateOrder': return <GenerateOrder />;
                    case 'inventory': return <InventoryReport />;
                    default:
                        return <div className="p-8"><h2 className="text-2xl font-semibold">Módulo em construção</h2><p>Esta funcionalidade ainda não foi implementada.</p></div>;
                }
        }
    };
    
    const getHeaderInfo = () => {
        switch(currentErpView.type) {
            case 'product_form': return { title: currentErpView.productId ? 'Editar Produto' : 'Novo Produto', activeModule: 'products' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'products' }) };
            case 'customer_form': return { title: currentErpView.customerId ? 'Editar Cliente' : 'Novo Cliente', activeModule: 'customers' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'customers' }) };
            case 'category_form': return { title: currentErpView.categoryId ? 'Editar Categoria' : 'Nova Categoria', activeModule: 'categories' as ActiveModule, backAction: () => setCurrentErpView({ type: 'module', id: 'categories' }) };
            case 'module':
            default:
                const label = menuModules.flatMap(m => m.items).find(i => i.id === currentErpView.id)?.label || 'Dashboard';
                return { title: label, activeModule: currentErpView.id, backAction: null };
        }
    };

    const { title, activeModule, backAction } = getHeaderInfo();

    return (
        <div className="flex flex-col md:flex-row h-full bg-gray-100 dark:bg-gray-900">
            {/* 
                MENU RESPONSIVO: 
                - Mobile: Barra horizontal rolável no topo
                - Desktop: Sidebar vertical à esquerda
            */}
            <aside className="
                w-full md:w-64 
                bg-white dark:bg-gray-800 
                shadow-md md:shadow-none md:border-r dark:border-gray-700
                flex flex-col
                order-1
            ">
                <div className="hidden md:block p-4 border-b dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Gestão ERP</h1>
                    <span className="text-sm text-gray-500">UseNatural</span>
                </div>

                {/* Container de navegação */}
                <nav className="flex-grow md:p-2 overflow-x-auto md:overflow-y-auto whitespace-nowrap md:whitespace-normal">
                    <ul className="flex md:flex-col p-2 md:p-0 gap-2 md:gap-1 items-center md:items-stretch">
                        {menuModules.map(module => {
                            const isExpanded = expandedSections.has(module.id);
                            return (
                                <li key={module.id} className="inline-flex md:block md:flex-col">
                                    {/* Botão do Módulo (Cabeçalho da Seção) - Hidden on Mobile */}
                                    <button 
                                        onClick={() => toggleSection(module.id)} 
                                        className="hidden md:flex items-center justify-between w-full gap-3 px-4 py-2 rounded-md text-sm font-semibold transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                                    >
                                        <div className="flex items-center gap-3"><module.icon className="w-5 h-5" /><span>{module.label}</span></div>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>

                                    {/* Lista de Itens do Módulo 
                                        CORREÇÃO CRÍTICA: 
                                        - Mobile (padrão): 'flex' (sempre visível, layout horizontal).
                                        - Desktop (md): 'hidden' se não expandido, 'block' se expandido.
                                    */}
                                    <ul className={`
                                        flex flex-row md:flex-col gap-2 md:gap-1 md:pl-6 md:mt-1
                                        ${!isExpanded ? 'md:hidden' : 'md:block'}
                                    `}>
                                        {module.items.map(item => (
                                            <li key={item.id} className="inline-block md:block">
                                                <a 
                                                    href="#" 
                                                    onClick={(e) => { e.preventDefault(); setCurrentErpView({ type: 'module', id: item.id }); }} 
                                                    className={`
                                                        flex items-center gap-2 px-3 py-2 md:px-4 rounded-md text-sm font-medium transition-colors border md:border-0
                                                        ${activeModule === item.id 
                                                            ? 'bg-theme-primary text-white md:bg-theme-primary/10 md:text-theme-primary border-theme-primary' 
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'}
                                                    `}
                                                >
                                                    {/* Ícone no mobile para ajudar contexto, já que o cabeçalho está oculto */}
                                                    <span className="md:hidden opacity-70">
                                                        <module.icon size={14} />
                                                    </span>
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

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 flex flex-col overflow-hidden order-2 h-full">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-4 shrink-0">
                    {backAction && (
                        <Button variant="secondary" onClick={backAction} className="!py-2 !px-3">
                            <ArrowLeft size={16} className="mr-2"/> Voltar
                        </Button>
                    )}
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 capitalize truncate">{title}</h2>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {renderActiveModule()}
                </div>
            </main>
        </div>
    );
};

export default ERPScreen;
