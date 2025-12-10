
import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import { Target, Send, Bot, Ticket, ArrowLeft } from 'lucide-react';
import { db } from '../../services/databaseService';
import type { Segment } from '../../types';

// Importa os componentes de listagem
import Segmentation from './Segmentation';
import Campaigns from './Campaigns';
import CouponsScreen from './CouponsScreen';

// Importa os novos componentes de formulário (página inteira)
import SegmentFormPage from './SegmentFormPage';
import CampaignFormPage from './CampaignFormPage';
import CouponFormPage from './CouponFormPage';

type ActiveCrmModule = 'segmentation' | 'campaigns' | 'automation' | 'coupons';

// Novo tipo para controlar a visualização DENTRO do módulo CRM.
type CrmView = 
  | { type: 'module', id: ActiveCrmModule }
  | { type: 'segment_form', segmentId?: string }
  | { type: 'campaign_form', campaignId?: string }
  | { type: 'coupon_form', couponId?: string };

interface CRMScreenProps {
    setView: (view: 'pos' | 'erp' | 'crm') => void;
}

const CRMScreen: React.FC<CRMScreenProps> = ({ setView }) => {
    const [crmView, setCrmView] = useState<CrmView>({ type: 'module', id: 'segmentation' });
    const [segments, setSegments] = useState<Segment[]>([]);

    // Carrega os segmentos aqui para poder passá-los para o formulário de campanha.
    useEffect(() => {
        db.getAll('segments').then(setSegments);
    }, [crmView]); // Recarrega se a view mudar, para garantir dados atualizados.

    const menuItems = [
        { id: 'segmentation', label: 'Segmentação', icon: Target },
        { id: 'campaigns', label: 'Campanhas', icon: Send },
        { id: 'automation', label: 'Automação', icon: Bot },
        { id: 'coupons', label: 'Cupons', icon: Ticket },
    ];
    
    const renderActiveView = () => {
        switch(crmView.type) {
            case 'segment_form':
                return <SegmentFormPage segmentId={crmView.segmentId} onBack={() => setCrmView({ type: 'module', id: 'segmentation' })} />;
            case 'campaign_form':
                return <CampaignFormPage campaignId={crmView.campaignId} segments={segments} onBack={() => setCrmView({ type: 'module', id: 'campaigns' })} />;
            case 'coupon_form':
                return <CouponFormPage couponId={crmView.couponId} onBack={() => setCrmView({ type: 'module', id: 'coupons' })} />;
            
            case 'module':
            default:
                switch(crmView.id) {
                    case 'segmentation':
                        return <Segmentation onNewSegment={() => setCrmView({ type: 'segment_form' })} onEditSegment={(id) => setCrmView({ type: 'segment_form', segmentId: id })} />;
                    case 'campaigns':
                        return <Campaigns onNewCampaign={() => setCrmView({ type: 'campaign_form' })} onEditCampaign={(id) => setCrmView({ type: 'campaign_form', campaignId: id })} />;
                    case 'coupons':
                         return <CouponsScreen onNewCoupon={() => setCrmView({ type: 'coupon_form' })} onEditCoupon={(id) => setCrmView({ type: 'coupon_form', couponId: id })} />;
                    default:
                        return <div className="p-8 text-center text-gray-500"><h2 className="text-2xl font-semibold">Módulo em construção</h2><p>Esta funcionalidade ainda não foi implementada.</p></div>;
                }
        }
    };

    const getHeaderInfo = () => {
        switch (crmView.type) {
            case 'segment_form': return { title: crmView.segmentId ? 'Editar Segmento' : 'Novo Segmento', activeModule: 'segmentation' as ActiveCrmModule, backView: { type: 'module', id: 'segmentation' } as CrmView };
            case 'campaign_form': return { title: crmView.campaignId ? 'Editar Campanha' : 'Nova Campanha', activeModule: 'campaigns' as ActiveCrmModule, backView: { type: 'module', id: 'campaigns' } as CrmView };
            case 'coupon_form': return { title: crmView.couponId ? 'Editar Cupom' : 'Novo Cupom', activeModule: 'coupons' as ActiveCrmModule, backView: { type: 'module', id: 'coupons' } as CrmView };
            case 'module':
            default:
                return { title: menuItems.find(item => item.id === crmView.id)?.label || 'CRM', activeModule: crmView.id, backView: null };
        }
    };
    
    const { title, activeModule, backView } = getHeaderInfo();

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
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">CRM & Marketing</h1>
                    <span className="text-sm text-gray-500">UseNatural</span>
                </div>
                
                <nav className="flex-grow md:p-2 overflow-x-auto whitespace-nowrap md:whitespace-normal">
                    <ul className="flex md:flex-col p-2 md:p-0 gap-2 md:gap-1">
                        {menuItems.map(item => (
                            <li key={item.id} className="inline-block md:block">
                                <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); setCrmView({ type: 'module', id: item.id as ActiveCrmModule }); }} 
                                    className={`
                                        flex items-center gap-2 px-3 py-2 md:px-4 rounded-md text-sm font-medium transition-colors border md:border-0
                                        ${activeModule === item.id 
                                            ? 'bg-theme-primary text-white md:bg-theme-primary/10 md:text-theme-primary border-theme-primary' 
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'}
                                    `}
                                >
                                    <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                                    <span>{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden order-2 h-full">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center gap-4 shrink-0">
                    {backView && (
                        <Button variant="secondary" onClick={() => setCrmView(backView)} className="!py-2 !px-3">
                            <ArrowLeft size={16} className="mr-2"/> Voltar
                        </Button>
                    )}
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 capitalize">{title}</h2>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {renderActiveView()}
                </div>
            </main>
        </div>
    );
};

export default CRMScreen;
