
import type { Sale } from '../types';

/**
 * Simula a emissão de uma NFC-e (Nota Fiscal de Consumidor Eletrônica).
 * Em um cenário real, isso faria uma chamada para uma API da SEFAZ ou um provedor de mensageria.
 */
export async function emitNFCe(sale: Sale): Promise<boolean> {
    console.log(`[FiscalService] Iniciando emissão de NFC-e para venda ${sale.id}...`);
    
    // Simula um delay de rede/processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simula uma taxa de sucesso de 95%
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
        console.log(`[FiscalService] NFC-e emitida com sucesso para venda ${sale.id}.`);
        // Aqui poderíamos salvar a chave de acesso, protocolo, etc.
        return true;
    } else {
        console.error(`[FiscalService] Erro ao emitir NFC-e para venda ${sale.id}: Falha na comunicação com a SEFAZ.`);
        return false;
    }
}

/**
 * Gera o XML da nota fiscal (Simulação)
 */
export function generateNFCeXML(sale: Sale): string {
    return `<?xml version="1.0" encoding="UTF-8"?><nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><NFe><infNFe Id="NFe${sale.id.replace(/-/g, '')}" versao="4.00">...</infNFe></NFe></nfeProc>`;
}
