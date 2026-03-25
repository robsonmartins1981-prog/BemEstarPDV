
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

export type UserRole = 'ADMIN' | 'USER_CAIXA' | 'GERENTE';

export type Module = 'PDV' | 'ERP' | 'ESTOQUE' | 'CONFIG';

export type SubModuleERP = 
  | 'OPERACOES_CAIXA' 
  | 'SISTEMA_ACESSOS' 
  | 'ESTOQUE' 
  | 'COMPRAS' 
  | 'CLIENTES' 
  | 'FORNECEDORES' 
  | 'ADMINISTRACAO';

export interface User {
    id: string;
    username: string;
    password?: string;
    role: UserRole;
    permissions: string[]; // Can be module names or specific submodule names
    active: boolean;
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    cpf?: string;
}

export type ProductUnitType = 'UN' | 'KG';

export interface Product {
  id: string; // Código Interno do Produto
  barcode?: string; // Código de Barras (EAN/GTIN)
  name: string; 
  brand?: string; 
  sku?: string;
  price: number; 
  costPrice?: number; 
  unitType: ProductUnitType;
  isBulk: boolean; 
  scaleCode?: string; 
  stock: number; 
  minStock?: number; 
  ncm?: string; 
  cfop?: string; 
  origin?: string; 
  csosn_cst?: string; 
  image?: string; 
  images?: string[]; // Up to 5 images
  categoryId?: string; 
  supplierId?: string; 
  purchaseConversionFactor?: number;
  isKit?: boolean;
  kitItems?: { productId: string; quantity: number }[];
  
  // Mix Personalizado (Feature 5)
  isMix?: boolean;
  mixComponents?: { productId: string; percentage: number }[]; // Porcentagem de cada item no mix
  
  // Controle de Quebra/Perda (Feature 1)
  naturalLossRate?: number; // Taxa de perda natural (ex: 0.02 para 2%)
  
  // Histórico de Preços
  purchasePriceHistory?: { date: Date; price: number }[]; // Histórico de preço de compra
  salePriceHistory?: { date: Date; price: number }[];     // Histórico de preço de venda
}

/**
 * Movimentação de Estoque
 */
export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  type: 'IN' | 'OUT' | 'ADJUSTMENT'; // Entrada, Saída, Ajuste
  reason: string; // Motivo (ex: Venda, Compra, Perda, Inventário)
  date: Date;
  costPrice?: number; // Preço de custo no momento da entrada
  userId?: string; // Usuário que realizou a movimentação
}

/**
 * Alerta de Estoque Baixo
 */
export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  date: Date;
  isResolved: boolean;
}

export interface SaleItem {
  productId: string; 
  productName: string; 
  productImage?: string; 
  unitPrice: number; 
  quantity: number; 
  unitType?: ProductUnitType;
  discount: number; 
  total: number; 
  lotNumber?: string; 
  expirationDate?: Date; 
  
  // Mix Personalizado
  isMix?: boolean;
  components?: { productId: string; quantity: number; unitPrice: number }[]; // Detalhamento para baixa no estoque
}

export interface Shortcut {
  id: string;
  key: string; // e.g., 'F1', 'F2', 'Enter'
  action: string; // e.g., 'FINALIZE_SALE', 'OPEN_CUSTOMER_MODAL', 'CLEAR_CART'
  label: string;
}

export interface AppConfig {
  id: 'main';
  companyName: string;
  autoAddOnBarcodeMatch: boolean;
  defaultPrintReceipt: boolean;
  theme: 'light' | 'dark' | 'system';
  printerName?: string;
  printerWidth?: '58mm' | '80mm';
  printAuto?: boolean;
  printLogo?: boolean;
  localDatabasePath?: string;
}

export interface Payment {
  method: PaymentMethod; 
  amount: number; 
  customerId?: string; 
  settled?: boolean;
  settledAt?: string;
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
  sessionId?: string; 
  manualDiscountType?: 'PERCENTAGE' | 'FIXED_AMOUNT'; 
  manualDiscountValue?: number;
  type?: OrderType;
  deliveryAddress?: string;
  deliveryFee?: number;
  contactPhone?: string;
  notes?: string;
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
    cpf: string;
    pis: string;
    address: string;
    phone: string;
    cellphone: string;
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

export interface StoreSettings {
    id: 'main';
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
  payments?: Payment[];
}

export interface Terminal {
  id: string;
  name: string;
  active: boolean;
  lastOpenedAt?: string;
  lastOpenedBy?: string;
}

export interface CashOperation {
  id: string;
  sessionId: string;
  type: 'SUPRIMENTO' | 'SANGRIA' | 'REFORCO' | 'VENDA';
  amount: number;
  date: string;
  description: string;
  paymentMethod?: PaymentMethod;
}

export interface CashSession { 
  id: string; 
  openedAt: string; 
  closedAt?: string; 
  openedBy: string;
  terminalId: string;
  initialAmount: number; 
  finalAmount?: number;
  expectedAmount?: number;
  status: 'OPEN' | 'CLOSED'; 
  notes?: string;
  sales: Sale[];
}
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
  socialMedia?: string; 
  birthDate?: Date; 
  creditLimit?: number; 
  observations?: string; 
  tags?: string[];
}
export interface ExpenseSubItem { id: string; description: string; amount: number; categoryId?: string; }
export interface Expense { id: string; description: string; amount: number; supplierId?: string; categoryId?: string; dueDate: Date; purchaseDate: Date; paidDate?: Date; status: 'PENDING' | 'PAID'; isFixed?: boolean; subItems?: ExpenseSubItem[]; }
export interface InventoryLot { id: string; productId: string; supplierId?: string; lotNumber?: string; quantity: number; expirationDate?: Date; entryDate: Date; costPrice: number; }
export interface InventoryAdjustment { id: string; productId: string; lotId: string; quantityChange: number; reason: string; date: Date; }

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

export type NFeItemStatus = 'LINKED' | 'UNLINKED' | 'NEW';
export interface NFeItem { 
  code: string; 
  name: string; 
  ncm: string; 
  cfop: string;
  uCom: string;
  quantity: number; 
  unitPrice: number; 
  totalPrice: number; 
  discount: number;
  otherExpenses: number;
  freight: number;
  insurance: number;
  status: NFeItemStatus; 
  linkedProductDetails?: Product; 
  expirationDate: string; 
  lotNumber?: string; 
  conversionFactor: number;
  sellingPrice?: number;
  profitMargin?: number;
}
export interface NFeData { supplier: { cnpj: string; name: string }; items: NFeItem[]; totalAmount: number; issueDate: Date; }
