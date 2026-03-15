
import { db } from './databaseService';
import { v4 as uuidv4 } from 'uuid';
import type { SyncJob } from '../types';
import { emitNFCe } from './fiscalService';

const POLLING_INTERVAL = 10000; // 10 segundos
const MAX_RETRIES = 3;

/**
 * Adiciona um trabalho à fila de sincronização.
 * Esta função é chamada pela UI para garantir que a operação seja processada em segundo plano.
 * @param type O tipo de trabalho (ex: 'FISCAL_EMISSION').
 * @param payload Os dados necessários para executar o trabalho (ex: { saleId: '...' }).
 */
export async function addToQueue(type: 'FISCAL_EMISSION', payload: any) {
    try {
        const job: SyncJob = {
            id: uuidv4(),
            type,
            payload,
            createdAt: new Date(),
            retryCount: 0,
            status: 'PENDING',
        };
        await db.add('syncQueue', job);
        console.log(`[SyncService] Job ${job.id} adicionado à fila.`);
        
        // Tenta processar imediatamente se estiver online
        if (navigator.onLine) {
            processQueue();
        }
    } catch (error) {
        console.error("[SyncService] Erro ao adicionar job à fila:", error);
    }
}

/**
 * Processa os itens pendentes na fila de sincronização.
 */
async function processQueue() {
    if (!navigator.onLine) {
        console.log("[SyncService] Offline. Pausando processamento da fila.");
        return;
    }

    try {
        // Busca todos os jobs pendentes
        const jobs = await db.getAllFromIndex('syncQueue', 'status', 'PENDING');
        
        if (jobs.length === 0) return;

        console.log(`[SyncService] Processando ${jobs.length} jobs pendentes...`);

        for (const job of jobs) {
            // Verifica se já atingiu o limite de tentativas
            if (job.retryCount >= MAX_RETRIES) {
                console.warn(`[SyncService] Job ${job.id} falhou ${MAX_RETRIES} vezes. Marcando como FAILED.`);
                job.status = 'FAILED';
                await db.put('syncQueue', job);
                continue;
            }

            let success = false;

            // Executa a lógica baseada no tipo de job
            switch (job.type) {
                case 'FISCAL_EMISSION':
                    success = await processFiscalEmission(job.payload);
                    break;
                default:
                    console.warn(`[SyncService] Tipo de job desconhecido: ${job.type}`);
                    job.status = 'FAILED'; // Marca como falha para não travar a fila
                    await db.put('syncQueue', job);
                    continue;
            }

            if (success) {
                // Se sucesso, remove da fila
                await db.delete('syncQueue', job.id);
                console.log(`[SyncService] Job ${job.id} processado com sucesso e removido.`);
            } else {
                // Se falha, incrementa retry e atualiza
                job.retryCount++;
                job.lastAttempt = new Date();
                await db.put('syncQueue', job);
                console.log(`[SyncService] Falha ao processar job ${job.id}. Tentativa ${job.retryCount} de ${MAX_RETRIES}.`);
            }
        }
    } catch (error) {
        console.error("[SyncService] Erro fatal ao processar fila:", error);
    }
}

/**
 * Lógica específica para emitir NFC-e a partir da fila.
 */
async function processFiscalEmission(payload: { saleId: string }): Promise<boolean> {
    try {
        const sale = await db.get('sales', payload.saleId);
        if (!sale) {
            console.error(`[SyncService] Venda ${payload.saleId} não encontrada.`);
            return false; 
        }

        if (sale.isSynced) {
            return true; // Já foi sincronizado anteriormente
        }

        const success = await emitNFCe(sale);
        
        if (success) {
            // Atualiza a flag na venda
            sale.isSynced = true;
            await db.put('sales', sale);
        }
        
        return success;
    } catch (error) {
        console.error(`[SyncService] Erro na emissão fiscal para venda ${payload.saleId}:`, error);
        return false;
    }
}

/**
 * Inicializa o serviço de sincronização.
 * Configura listeners e timers.
 */
export function startSyncService() {
    console.log("[SyncService] Serviço iniciado.");
    
    // Processamento inicial
    processQueue();

    // Listeners de estado de conexão
    window.addEventListener('online', () => {
        console.log("[SyncService] Conexão restabelecida. Processando fila...");
        processQueue();
    });

    // Polling periódico
    setInterval(() => {
        processQueue();
    }, POLLING_INTERVAL);
}
