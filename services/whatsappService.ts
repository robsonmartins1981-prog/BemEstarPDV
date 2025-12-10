// services/whatsappService.ts
// Este arquivo define a INTERFACE para um serviço de envio de mensagens via WhatsApp.
// Assim como o serviço de e-mail, isso permite um design desacoplado,
// onde a implementação real (que se conectaria à API do WhatsApp Business)
// pode ser trocada facilmente.

/**
 * Interface que define o contrato para um serviço de envio de mensagens do WhatsApp.
 */
interface WhatsappServiceInterface {
    /**
     * Envia uma mensagem de texto para um número de telefone.
     * @param to O número de telefone do destinatário (em formato internacional, ex: +5511999999999).
     * @param message O conteúdo da mensagem de texto.
     * @returns Uma Promise que resolve quando a mensagem é enviada com sucesso.
     */
    send(to: string, message: string): Promise<void>;
}


/**
 * MockWhatsappService é uma implementação **falsa** da WhatsappServiceInterface.
 * Ela não envia mensagens reais. Apenas registra a ação no console para fins de desenvolvimento.
 */
class MockWhatsappService implements WhatsappServiceInterface {
    async send(to: string, message: string): Promise<void> {
        console.log("--- SIMULAÇÃO DE ENVIO DE WHATSAPP ---");
        console.log(`Para: ${to}`);
        console.log("Mensagem:");
        console.log(message);
        console.log("---------------------------------------");
        
        // Simula uma pequena demora de rede.
        return new Promise(resolve => setTimeout(resolve, 150));
    }
}

// Exporta uma instância única (Singleton) do nosso serviço de WhatsApp mock.
export const whatsappService: WhatsappServiceInterface = new MockWhatsappService();
