// services/crmService.ts
// Este serviço contém a lógica de negócio principal para o módulo de CRM.
// Ele é responsável por interpretar as regras de segmentação e executar as campanhas,
// agindo como uma ponte entre a UI e o banco de dados.

import { db } from './databaseService';
import type { Segment, Customer, Sale, Campaign } from '../types';
import { emailService } from './emailService';
import { whatsappService } from './whatsappService';


/**
 * Busca e retorna uma lista de clientes que correspondem às regras de um determinado segmento.
 * Esta é a função central da lógica de segmentação.
 * @param segment O objeto do segmento contendo as regras.
 * @returns Uma Promise que resolve para um array de objetos Customer.
 */
export async function getCustomersForSegment(segment: Segment): Promise<Customer[]> {
    const allCustomers = await db.getAll('customers');
    const allSales = await db.getAll('sales');
    let filteredCustomers = new Set<Customer>();

    // Itera sobre cada regra do segmento.
    // A lógica atual é 'OU' (um cliente precisa corresponder a pelo menos uma regra).
    for (const rule of segment.rules) {
        let customersForRule: Customer[] = [];

        switch (rule.type) {
            case 'INACTIVE_CUSTOMERS':
                const daysInactive = (rule.value as number) || 30;
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

                const recentBuyers = new Set<string>();
                allSales
                    .filter(sale => sale.date > cutoffDate && sale.customerId)
                    .forEach(sale => recentBuyers.add(sale.customerId!));

                customersForRule = allCustomers.filter(c => !recentBuyers.has(c.id));
                break;

            case 'BIRTHDAY_MONTH':
                const currentMonth = new Date().getMonth();
                customersForRule = allCustomers.filter(c => c.birthDate && new Date(c.birthDate).getMonth() === currentMonth);
                break;
            
            // Outras regras (VIP_CUSTOMERS, PRODUCT_BUYERS) seriam implementadas aqui.
            // Exemplo:
            // case 'VIP_CUSTOMERS':
            //     const minAmount = rule.value as number || 500;
            //     // ... lógica para calcular total gasto por cliente ...
            //     break;
        }
        
        // Adiciona os clientes encontrados por esta regra ao conjunto de resultados.
        customersForRule.forEach(c => filteredCustomers.add(c));
    }
    
    return Array.from(filteredCustomers);
}


/**
 * Simula o disparo de uma campanha de marketing.
 * Busca os clientes do segmento, personaliza a mensagem e chama o serviço de envio apropriado.
 * @param campaignId O ID da campanha a ser disparada.
 * @returns Uma Promise que resolve com um resumo do resultado do disparo.
 */
export async function dispatchCampaign(campaignId: string) {
    console.log(`--- INICIANDO DISPARO DA CAMPANHA ${campaignId} ---`);
    const campaign = await db.get('campaigns', campaignId);
    if (!campaign) throw new Error("Campanha não encontrada.");

    const segment = await db.get('segments', campaign.segmentId);
    if (!segment) throw new Error("Segmento da campanha não encontrado.");

    const customers = await getCustomersForSegment(segment);

    let sentCount = 0;
    for (const customer of customers) {
        // Personaliza a mensagem substituindo as variáveis.
        const message = campaign.messageTemplate
            .replace(/\[Nome do Cliente\]/g, customer.name)
            .replace(/\[Primeiro Nome\]/g, customer.name.split(' ')[0]);

        try {
            if (campaign.channel === 'EMAIL') {
                if (!customer.email) {
                     console.warn(`Cliente ${customer.name} (ID: ${customer.id}) pulado: sem e-mail.`);
                     continue;
                }
                // Chama a interface do serviço de e-mail (atualmente um mock).
                await emailService.send(customer.email, campaign.subject || campaign.name, message);
                console.log(`E-mail para ${customer.email} enviado com sucesso.`);

            } else if (campaign.channel === 'WHATSAPP') {
                 if (!customer.phone) {
                     console.warn(`Cliente ${customer.name} (ID: ${customer.id}) pulado: sem telefone.`);
                     continue;
                }
                // Chama a interface do serviço de WhatsApp (atualmente um mock).
                await whatsappService.send(customer.phone, message);
                console.log(`WhatsApp para ${customer.phone} enviado com sucesso.`);
            }
            sentCount++;
        } catch (error) {
             console.error(`Falha ao enviar para ${customer.name}:`, error);
        }
    }
    
    console.log(`--- DISPARO DA CAMPANHA ${campaignId} CONCLUÍDO ---`);
    return {
        customerCount: customers.length,
        sent: sentCount,
    };
}
