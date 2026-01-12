
// types.ts
export enum PaymentMethod {
  DINHEIRO = 'Dinheiro',
  PIX = 'PIX',
  DEBITO = 'Débito',
  CREDITO = 'Crédito',
  NOTINHA = 'Notinha', 
}

export enum OrderType {
  RETIRADA = 'Retirada',
  ENTREGA = 'Entrega'
}

export interface Product {
  id: string; // Código Interno do Produto
  barcode?: string; // Código de Barras (EAN/GTIN)
  name: string; 
  brand?: string; 
  price: number; 
  costPrice?: number; 
  isBulk: boolean; 
  scaleCode?: string; 
  stock: number; 
  minStock?: number; 
  ncm?: string; 
  cfop?: string; 
  origin?: string; 
  csosn_cst?: string; 
  image?: string; 
  categoryId?: string; 
  supplierId?: string; 
}

export interface SaleItem {
  productId: string; 
  productName: string; 
  productImage?: string; 
  unitPrice: number; 
  quantity: number; 
  discount: number; 
  total: number; 
  lotNumber?: string; 
  expirationDate?: Date; 
}

export interface Payment {
  method: PaymentMethod; 
  amount: number; 
  customerId?: string; 
}

export interface Sale {
  id: string; 
  date: Date; 
  items: SaleItem[]; 
  subtotal: number; 
  totalDiscount: number; 
  totalAmount: number; 
  payments: Payment[]; 
  change: number; 
  customerCPF?: string; 
  customerId?: string; 
  isSynced: boolean; 
  couponCodeApplied?: string; 
  manualDiscountType?: 'PERCENTAGE' | 'FIXED_AMOUNT'; 
  manualDiscountValue?: number; 
}

export interface Employee {
    id: string;
    name: string;
    roleId: string; 
    salary: number;
    status: 'ACTIVE' | 'INACTIVE';
    hireDate: Date;
    contractEndDate?: Date;
    lastVacationDate?: Date;
    shiftStart?: string; 
    lunchStart?: string; 
    lunchEnd?: string;   
    shiftEnd?: string;   
}

export interface HistoricalCashEntry {
    id: string;
    date: Date;
    terminal: string; 
    cash: number;
    pix: number;
    credit: number;
    debit: number;
    withdrawal: number;
    totalGross: number;
    totalNet: number;
}

export interface FinancialEntry {
    id: string;
    date: Date;
    type: 'REVENUE' | 'EXPENSE';
    category: string; 
    amount: number;
    referenceId?: string;
}

export interface AuditLog {
    id: string;
    timestamp: Date;
    module: string;
    action: string;
    details: string;
    userId?: string;
}

export interface DeliveryZone {
    id: string;
    neighborhood: string;
    fee: number;
}

export interface StoreSettings {
    id: 'main';
    whatsappNumber: string;
    storeName: string;
}

export interface ParkedSale { 
  id: string; 
  createdAt: Date; 
  items: SaleItem[]; 
  total: number; 
  type: OrderType; 
  customerId?: string; 
  customerName?: string; 
  deliveryAddress?: string; 
  contactPhone?: string; 
  notes?: string;
  deliveryFee?: number;
  neighborhood?: string;
}

export interface CashTransaction { type: 'SUPRIMENTO' | 'SANGRIA' | 'REFORCO'; amount: number; date: Date; description: string; }
export interface CashSession { id: 'active' | string; startDate: Date; endDate?: Date; initialAmount: number; shiftName: string; transactions: CashTransaction[]; sales: Sale[]; status: 'OPEN' | 'CLOSED'; }
export interface Category { id: string; name: string; }
export interface Supplier { id: string; name: string; cnpj: string; contactPerson?: string; phone?: string; email?: string; }
export interface Customer { 
  id: string; 
  name: string; 
  cpf: string; 
  phone?: string; 
  cellphone?: string; 
  email?: string; 
  address?: string; 
  neighborhoodId?: string; 
  socialMedia?: string; 
  birthDate?: Date; 
  creditLimit?: number; 
  observations?: string; 
}
export interface Expense { id: string; description: string; amount: number; supplierId?: string; categoryId: string; dueDate: Date; paidDate?: Date; status: 'PENDING' | 'PAID'; }
export interface InventoryLot { id: string; productId: string; supplierId?: string; quantity: number; expirationDate?: Date; entryDate: Date; costPrice: number; }
export interface InventoryAdjustment { id: string; productId: string; lotId: string; quantityChange: number; reason: string; date: Date; }
export interface Coupon { id: string; code: string; type: 'PERCENTAGE' | 'FIXED_AMOUNT'; value: number; expiryDate: Date; maxUses: number; currentUses: number; isActive: number; }
export type SegmentRuleType = 'INACTIVE_CUSTOMERS' | 'BIRTHDAY_MONTH' | 'VIP_CUSTOMERS' | 'PRODUCT_BUYERS';
export interface SegmentRule { type: SegmentRuleType; value: any; }
export interface Segment { id: string; name: string; rules: SegmentRule[]; description: string; }
export interface Campaign { id: string; name: string; segmentId: string; channel: 'EMAIL' | 'WHATSAPP'; subject?: string; messageTemplate: string; status: 'DRAFT' | 'SENT'; }
export interface AutomationRule { id: string; name: string; trigger: string; campaignId: string; isActive: number; }

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

export interface FiscalConfig { id: 'main'; emitente: EmitenteConfig; api: ApiConfig; nfce: NfceConfig; }

export interface SyncJob { id: string; type: string; payload: any; createdAt: Date; retryCount: number; lastAttempt?: Date; status: 'PENDING' | 'FAILED'; }
export type NFeItemStatus = 'LINKED' | 'UNLINKED' | 'NEW';
export interface NFeItem { code: string; name: string; ncm: string; quantity: number; unitPrice: number; totalPrice: number; status: NFeItemStatus; linkedProductDetails?: Product; expirationDate: string; conversionFactor: number; }
export interface NFeData { supplier: { cnpj: string; name: string }; items: NFeItem[]; totalAmount: number; issueDate: Date; }
