// services/emailService.ts
// Este arquivo define a INTERFACE para um serviço de envio de e-mail.
// A aplicação principal deve usar apenas esta interface, não a implementação concreta.
// Isso segue o Princípio da Inversão de Dependência (DIP) e permite trocar
// o provedor de e-mail (ex: SendGrid, Mailgun) no futuro sem alterar o código de negócio.

/**
 * Interface que define o contrato para um serviço de envio de e-mail.
 */
interface EmailServiceInterface {
    /**
     * Envia um e-mail.
     * @param to O endereço de e-mail do destinatário.
     * @param subject O assunto do e-mail.
     * @param body O corpo do e-mail (pode ser HTML ou texto simples).
     * @returns Uma Promise que resolve quando o e-mail é enviado com sucesso.
     */
    send(to: string, subject: string, body: string): Promise<void>;
}


/**
 * MockEmailService é uma implementação **falsa** da EmailServiceInterface.
 * Ela não envia e-mails de verdade. Em vez disso, ela registra a ação no console.
 * Isso é extremamente útil para desenvolvimento e testes, pois podemos simular
 * o envio sem precisar de credenciais de API ou gastar créditos de envio.
 */
class MockEmailService implements EmailServiceInterface {
    async send(to: string, subject: string, body: string): Promise<void> {
        console.log("--- SIMULAÇÃO DE ENVIO DE E-MAIL ---");
        console.log(`Para: ${to}`);
        console.log(`Assunto: ${subject}`);
        console.log("Corpo:");
        console.log(body);
        console.log("-------------------------------------");
        
        // Simula uma pequena demora de rede.
        return new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Exporta uma instância única (Singleton) do nosso serviço de e-mail mock.
// A aplicação importará esta instância para usar.
export const emailService: EmailServiceInterface = new MockEmailService();
