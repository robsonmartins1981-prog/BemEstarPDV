
// types.ts
// Este arquivo centraliza todas as definições de tipos e interfaces do sistema,
// garantindo consistência e um único ponto de referência para os modelos de dados.

// Define os possíveis métodos de pagamento aceitos no PDV.
// Usar um enum torna o código mais legível e menos propenso a erros de digitação.
export enum PaymentMethod {
  DINHEIRO = 'Dinheiro',
  PIX = 'PIX',
  DEBITO = 'Débito',
  CREDITO = 'Crédito',
  FIADO = 'Fiado', // Venda a prazo
}

// Interface para um produto no sistema.
// Expandido com campos para o ERP.
export interface Product {
  id: string; // Identificador único do produto (ex: código de barras).
  name: string; // Nome do produto.
  price: number; // Preço de venda unitário.
  costPrice?: number; // Preço de custo (para cálculo de margem).
  isBulk: boolean; // Flag para indicar se é um produto a granel (vendido por peso/kg).
  scaleCode?: string; // Código de 6 dígitos para balanças de pesagem (se 'isBulk' for true).
  stock: number; // Quantidade em estoque.
  minStock?: number; // Quantidade mínima para alerta de recompra.
  ncm?: string; // Nomenclatura Comum do Mercosul (código fiscal).
  cfop?: string; // Código Fiscal de Operações e Prestações.
  origin?: string; // Origem da mercadoria (código numérico).
  csosn_cst?: string; // Código de Situação da Operação no Simples Nacional / Código de Situação Tributária.
  image?: string; // URL da imagem do produto.
  categoryId?: string; // ID da categoria à qual o produto pertence.
  supplierId?: string; // ID do fornecedor padrão deste produto.
}

// Interface para um item dentro do carrinho de compras (e posteriormente, na venda).
export interface SaleItem {
  productId: string; // ID do produto associado.
  productName: string; // Nome do produto (denormalizado para facilitar a exibição).
  productImage?: string; // URL da imagem do produto (denormalizado).
  unitPrice: number; // Preço unitário no momento da venda.
  quantity: number; // Quantidade vendida (pode ser fracionada para produtos a granel).
  discount: number; // Desconto aplicado a este item específico (valor, não percentual).
  total: number; // Preço total do item (unitPrice * quantity - discount).
  lotNumber?: string; // Opcional: Para rastrear de qual lote o item saiu.
  expirationDate?: Date; // Opcional: Data de validade do lote.
}

// Interface para um pagamento realizado em uma venda.
// Uma única venda pode ter múltiplos pagamentos.
export interface Payment {
  method: PaymentMethod; // O método de pagamento utilizado.
  amount: number; // O valor pago com este método.
  customerId?: string; // ID do cliente para vendas 'Fiado'.
}

// Interface que representa uma venda completa.
export interface Sale {
  id: string; // ID único da venda (gerado no momento da finalização).
  date: Date; // Data e hora em que a venda foi concluída.
  items: SaleItem[]; // Lista de itens vendidos.
  subtotal: number; // Soma dos totais de todos os itens antes dos descontos gerais.
  totalDiscount: number; // Desconto aplicado sobre o total da venda.
  totalAmount: number; // Valor final da venda (subtotal - totalDiscount).
  payments: Payment[]; // Lista de pagamentos realizados.
  change: number; // Troco devolvido ao cliente (relevante para pagamento em dinheiro).
  customerCPF?: string; // CPF do cliente (opcional).
  customerId?: string; // ID do cliente associado à venda.
  isSynced: boolean; // Flag para controlar a sincronização com o ERP.
  couponCodeApplied?: string; // Código do cupom usado na venda.
  manualDiscountType?: 'PERCENTAGE' | 'FIXED_AMOUNT'; // Tipo de desconto manual.
  manualDiscountValue?: number; // Valor do desconto manual.
}

// Interface para um carrinho salvo (venda pendente).
export interface ParkedSale {
  id: string;
  createdAt: Date;
  items: SaleItem[];
  total: number;
  customerId?: string;
  customerName?: string;
  notes?: string;
}


// Interface para uma transação de caixa (reforço ou sangria).
export interface CashTransaction {
  type: 'SUPRIMENTO' | 'SANGRIA' | 'REFORCO'; // Tipo de transação.
  amount: number; // Valor da transação.
  date: Date; // Data e hora da transação.
  description: string; // Motivo/descrição da transação.
}

// Interface que representa uma sessão (turno) de caixa.
export interface CashSession {
  id: 'active' | string; // ID da sessão. 'active' é um ID especial para a sessão em andamento.
  startDate: Date; // Data e hora de abertura.
  endDate?: Date; // Data e hora de fechamento (opcional).
  initialAmount: number; // Valor inicial de troco (suprimento).
  transactions: CashTransaction[]; // Lista de suprimentos, sangrias e reforços.
  sales: Sale[]; // Lista de todas as vendas realizadas na sessão.
  status: 'OPEN' | 'CLOSED'; // Status da sessão.
}


// --- NOVOS TIPOS PARA O MÓULO ERP ---

// Interface para uma Categoria de Produto.
export interface Category {
  id: string;
  name: string;
}

// Interface para um Fornecedor.
export interface Supplier {
    id: string; // ID único (pode ser gerado com uuid).
    name: string; // Nome do fornecedor.
    cnpj: string; // CNPJ do fornecedor.
    contactPerson?: string; // Pessoa de contato.
    phone?: string; // Telefone.
    email?: string; // E-mail.
}

// Interface para um Cliente.
export interface Customer {
    id: string; // ID único.
    name: string; // Nome do cliente.
    cpf: string; // CPF do cliente.
    phone?: string; // Telefone.
    email?: string; // E-mail.
    address?: string; // Endereço.
    birthDate?: Date; // Data de nascimento.
    creditLimit?: number; // Limite de crédito para vendas 'Fiado'.
}

// Interface para uma Despesa (Contas a Pagar).
export interface Expense {
    id: string; // ID único.
    description: string; // Descrição da despesa.
    amount: number; // Valor da despesa.
    supplierId?: string; // ID do fornecedor associado.
    dueDate: Date; // Data de vencimento.
    paidDate?: Date; // Data de pagamento (se já foi paga).
    status: 'PENDING' | 'PAID'; // Status da conta.
}


// --- NOVOS TIPOS PARA O MÓDULO DE ESTOQUE ---

// Interface para um Lote de Inventário.
// Cada entrada de um produto no estoque (compra) gera um lote.
export interface InventoryLot {
  id: string; // ID único do lote.
  productId: string; // ID do produto ao qual o lote pertence.
  quantity: number; // Quantidade de itens/kg neste lote.
  expirationDate?: Date; // Data de validade do lote.
  entryDate: Date; // Data em que o lote entrou no estoque.
  costPrice: number; // Preço de custo unitário neste lote.
}

// Interface para um Ajuste Manual de Inventário.
// Registra entradas ou saídas manuais para acerto de contagem.
export interface InventoryAdjustment {
  id: string; // ID único do ajuste.
  productId: string; // ID do produto ajustado.
  lotId: string; // ID do lote que foi ajustado.
  quantityChange: number; // A mudança na quantidade (positiva para entrada, negativa para saída).
  reason: string; // Motivo do ajuste (ex: "Contagem de inventário", "Perda").
  date: Date; // Data do ajuste.
}


// --- NOVOS TIPOS PARA O MÓDULO CRM ---

// Interface para um Cupom de Desconto.
export interface Coupon {
  id: string;
  code: string; // Código do cupom (ex: VERAO10)
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number; // Valor do desconto (10 para 10% ou 10 para R$10)
  expiryDate: Date;
  maxUses: number; // Limite de usos totais.
  currentUses: number; // Quantos usos já foram feitos.
  isActive: number; // 1 para ativo, 0 para inativo.
}

// Define os tipos de regras de segmentação disponíveis.
export type SegmentRuleType = 
    | 'BIRTHDAY_MONTH' // Aniversariantes do mês
    | 'INACTIVE_CUSTOMERS' // Clientes inativos
    | 'VIP_CUSTOMERS' // Clientes com alto valor de compra
    | 'PRODUCT_BUYERS'; // Compradores de um produto específico

// Interface para uma regra de segmentação.
export interface SegmentRule {
    type: SegmentRuleType;
    // Parâmetros opcionais dependendo do tipo de regra.
    // Ex: para 'INACTIVE_CUSTOMERS', value pode ser o número de dias.
    // Ex: para 'VIP_CUSTOMERS', value pode ser o valor mínimo gasto.
    // Ex: para 'PRODUCT_BUYERS', value pode ser o ID do produto.
    value?: number | string; 
}

// Interface para um Segmento de Clientes.
export interface Segment {
    id: string; // ID único do segmento.
    name: string; // Nome do segmento (ex: "Clientes Sumidos").
    rules: SegmentRule[]; // Conjunto de regras que definem o segmento.
    description: string; // Descrição do que o segmento representa.
}

// Define os canais de comunicação para as campanhas.
export type CampaignChannel = 'EMAIL' | 'WHATSAPP';

// Interface para uma Campanha de Marketing.
export interface Campaign {
    id: string; // ID único da campanha.
    name: string; // Nome da campanha.
    segmentId: string; // ID do segmento de público-alvo.
    channel: CampaignChannel; // Canal de envio (Email ou WhatsApp).
    subject?: string; // Assunto (para campanhas de Email).
    messageTemplate: string; // O conteúdo da mensagem com variáveis (ex: "[Nome do Cliente]").
    status: 'DRAFT' | 'SENT'; // Status da campanha.
}

// Define os tipos de gatilhos para automações.
export type AutomationTriggerType = 'NEW_CUSTOMER' | 'CUSTOMER_BIRTHDAY';

// Interface para uma Regra de Automação.
export interface AutomationRule {
    id: string; // ID único da regra.
    name: string; // Nome da automação (ex: "Boas-vindas ao novo cliente").
    trigger: AutomationTriggerType; // O gatilho que dispara a ação.
    campaignId: string; // A campanha a ser enviada quando o gatilho é ativado.
    // Fix: Changed isActive from boolean to number to be a valid IndexedDB key.
    isActive: number; // Flag para ativar/desativar a automação (1 for true, 0 for false).
}

// --- NOVOS TIPOS PARA IMPORTAÇÃO DE NF-e ---

export type NFeItemStatus = 'LINKED' | 'UNLINKED' | 'NEW';

export interface NFeItem {
  code: string;
  name: string;
  ncm: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expirationDate: string;
  conversionFactor: number; // Fator de conversão (ex: 1 caixa = 12 unidades)
  // Campos para a UI
  status: NFeItemStatus;
  linkedProductDetails?: Product;
}

export interface NFeData {
  supplier: Partial<Supplier>;
  items: NFeItem[];
  totalAmount: number;
  issueDate: Date;
}

// --- NOVOS TIPOS PARA CONFIGURAÇÃO FISCAL ---

export interface EmitenteConfig {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  codigoIbgeCidade: string;
  regimeTributario: 'SimplesNacional' | 'LucroPresumido' | 'LucroReal';
}

export interface ApiConfig {
  provedorApi: 'TecnoSpeed' | 'PlugNotas' | 'FocusNFe' | 'Outro';
  apiKey: string;
  apiSecret: string;
}

export interface NfceConfig {
  ambiente: 'Homologacao' | 'Producao';
  serieNFCe: number;
  proximoNumeroNFCe: number;
  cscId: string;
  cscToken: string;
}

export interface FiscalConfig {
  id: 'main'; // ID estático para o objeto de configuração singleton
  emitente: EmitenteConfig;
  api: ApiConfig;
  nfce: NfceConfig;
  // O certificado é tratado separadamente, mas podemos armazenar o nome do arquivo.
  certificateFileName?: string;
  certificatePassword?: string;
}

// --- NOVOS TIPOS PARA SINCRONIZAÇÃO E BACKGROUND JOBS ---
export interface SyncJob {
    id: string;
    type: 'FISCAL_EMISSION'; // Podemos adicionar outros tipos futuramente
    payload: any; // Dados necessários para o job (ex: ID da venda)
    createdAt: Date;
    retryCount: number;
    lastAttempt?: Date;
    status: 'PENDING' | 'FAILED';
}
