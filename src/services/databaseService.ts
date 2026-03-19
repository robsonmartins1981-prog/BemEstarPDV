
// services/databaseService.ts
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Product, Sale, CashSession, CashOperation, Supplier, Customer, Expense, Segment, Campaign, AutomationRule, InventoryLot, InventoryAdjustment, ParkedSale, Category, Coupon, FiscalConfig, SyncJob, Employee, AuditLog, DeliveryZone, StoreSettings, User, Promotion, StockMovement, StockAlert, Shortcut, AppConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppDB extends DBSchema {
  products: { key: string; value: Product; indexes: { name: string; scaleCode: string; categoryId: string; supplierId: string; }; };
  sales: { key: string; value: Sale; indexes: { date: Date; customerId: string }; };
  parkedSales: { key: string; value: ParkedSale; indexes: { createdAt: Date }; };
  cashSessions: { key: string; value: CashSession; indexes: { openedAt: string }; };
  cashOperations: { key: string; value: CashOperation; indexes: { sessionId: string; date: string }; };
  categories: { key: string; value: Category; indexes: { name: string; }; };
  suppliers: { key: string; value: Supplier; indexes: { name: string, cnpj: string }; };
  customers: { key: string; value: Customer; indexes: { name: string; cpf: string }; };
  expenses: { key: string; value: Expense; indexes: { dueDate: Date; status: string }; };
  inventoryLots: { key: string; value: InventoryLot; indexes: { productId: string; expirationDate: string }; };
  inventoryAdjustments: { key: string; value: InventoryAdjustment; indexes: { productId: string; date: Date }; };
  stockMovements: { key: string; value: StockMovement; indexes: { [key: string]: any }; };
  stockAlerts: { key: string; value: StockAlert; indexes: { [key: string]: any }; };
  segments: { key: string; value: Segment; indexes: { name: string }; };
  campaigns: { key: string; value: Campaign; indexes: { name: string; status: string }; };
  automationRules: { key: string; value: AutomationRule; indexes: { trigger: string; isActive: number }; };
  coupons: { key: string; value: Coupon; indexes: { code: string }; };
  promotions: { key: string; value: Promotion; indexes: { active: number }; };
  fiscalConfig: { key: string; value: FiscalConfig; };
  syncQueue: { key: string; value: SyncJob; indexes: { status: string, type: string }; };
  employees: { key: string; value: Employee; indexes: { status: string }; };
  auditLogs: { key: string; value: AuditLog; indexes: { timestamp: Date, module: string }; };
  deliveryZones: { key: string; value: DeliveryZone; indexes: { neighborhood: string }; };
  storeSettings: { key: string; value: StoreSettings; };
  users: { key: string; value: User; indexes: { username: string }; };
  shortcuts: { key: string; value: Shortcut; indexes: { key: string }; };
  appConfig: { key: string; value: AppConfig; };
}

let db: IDBPDatabase<AppDB>;

export async function seedInitialProducts() {
  const initialCategories = [
    { id: uuidv4(), name: 'MERCEARIA' },
    { id: uuidv4(), name: 'HORTIFRUTI' },
    { id: uuidv4(), name: 'GRANEL' },
    { id: uuidv4(), name: 'BEBIDAS' }
  ];

  for (const cat of initialCategories) {
    const existing = await db.get('categories', cat.id);
    if (!existing) {
      await db.add('categories', cat);
    }
  }

  const getCatId = (name: string) => initialCategories.find(c => c.name === name)?.id || 'Sem Categoria';

  const initialProducts = [
    { sku: '7891000100101', name: 'ARROZ INTEGRAL 1KG', price: 12.50, category: 'MERCEARIA', unit: 'UN' },
    { sku: '7891000100102', name: 'FEIJAO PRETO 1KG', price: 9.80, category: 'MERCEARIA', unit: 'UN' },
    { sku: '7891000100103', name: 'ACUCAR DEMERARA 1KG', price: 7.20, category: 'MERCEARIA', unit: 'UN' },
    { sku: '7891000100104', name: 'SAL ROSA DO HIMALAIA', price: 15.90, category: 'MERCEARIA', unit: 'UN' },
    { sku: '7891000100105', name: 'AZEITE DE OLIVA EXTRA VIRGEM', price: 32.00, category: 'MERCEARIA', unit: 'UN' },
    { sku: '1001', name: 'BANANA PRATA', price: 6.99, category: 'HORTIFRUTI', unit: 'KG' },
    { sku: '1002', name: 'MACA GALA', price: 8.50, category: 'HORTIFRUTI', unit: 'KG' },
    { sku: '1003', name: 'TOMATE ITALIANO', price: 7.80, category: 'HORTIFRUTI', unit: 'KG' },
    { sku: '1004', name: 'CEBOLA BRANCA', price: 4.50, category: 'HORTIFRUTI', unit: 'KG' },
    { sku: '1005', name: 'BATATA DOCE', price: 5.20, category: 'HORTIFRUTI', unit: 'KG' },
    { sku: '2001', name: 'CASTANHA DO PARA', price: 89.00, category: 'GRANEL', unit: 'KG' },
    { sku: '2002', name: 'AMENDOA DEFUMADA', price: 75.00, category: 'GRANEL', unit: 'KG' },
    { sku: '2003', name: 'GRANOLA ARTESANAL', price: 25.00, category: 'GRANEL', unit: 'KG' },
    { sku: '2004', name: 'CHIA EM GRAOS', price: 18.00, category: 'GRANEL', unit: 'KG' },
    { sku: '2005', name: 'QUINOA REAL', price: 35.00, category: 'GRANEL', unit: 'KG' },
    { sku: '3001', name: 'KOMBUCHA LIMAO E GENGIBRE', price: 14.00, category: 'BEBIDAS', unit: 'UN' },
    { sku: '3002', name: 'SUCO DE UVA INTEGRAL 1L', price: 18.50, category: 'BEBIDAS', unit: 'UN' },
    { sku: '3003', name: 'AGUA MINERAL 500ML', price: 3.00, category: 'BEBIDAS', unit: 'UN' },
    { sku: '3004', name: 'CHA VERDE GELADO', price: 8.00, category: 'BEBIDAS', unit: 'UN' },
    { sku: '4001', name: 'MEL SILVESTRE 500G', price: 28.00, category: 'MERCEARIA', unit: 'UN' },
    { sku: '4002', name: 'PASTA DE AMENDOIM 500G', price: 22.00, category: 'MERCEARIA', unit: 'UN' },
    { sku: '5001', name: 'OVO CAIPIRA (DUZIA)', price: 18.00, category: 'MERCEARIA', unit: 'UN' },
    { sku: '5002', name: 'LEITE DE COCO 200ML', price: 6.50, category: 'MERCEARIA', unit: 'UN' },
  ];

  for (const p of initialProducts) {
    const existing = await db.get('products', p.sku);
    if (!existing) {
      await db.add('products', {
        id: p.sku,
        name: p.name,
        price: p.price,
        unitType: p.unit as 'UN' | 'KG',
        isBulk: p.unit === 'KG',
        stock: 50,
        categoryId: getCatId(p.category),
        sku: p.sku,
        barcode: p.sku
      });
    }
  }
}

/**
 * Inicializa o banco de dados IndexedDB
 */
export async function initDB() {
  if (db) return; 

  db = await openDB<AppDB>('BemEstarPDV', 27, {
    upgrade(database, oldVersion, newVersion, transaction) {
      const stores = [
        { name: 'products', indexes: ['name', 'scaleCode', 'categoryId', 'supplierId'] },
        { name: 'sales', indexes: ['date', 'customerId'] },
        { name: 'parkedSales', indexes: ['createdAt'] },
        { name: 'cashSessions', indexes: ['openedAt'] },
        { name: 'cashOperations', indexes: ['sessionId', 'date'] },
        { name: 'categories', indexes: ['name'] },
        { name: 'suppliers', indexes: ['name', 'cnpj'] },
        { name: 'customers', indexes: ['name', 'cpf'] },
        { name: 'expenses', indexes: ['dueDate', 'status'] },
        { name: 'inventoryLots', indexes: ['productId', 'expirationDate'] },
        { name: 'inventoryAdjustments', indexes: ['productId', 'date'] },
        { name: 'stockMovements', indexes: ['productId'] },
        { name: 'stockAlerts', indexes: ['productId'] },
        { name: 'segments', indexes: ['name'] },
        { name: 'campaigns', indexes: ['name', 'status'] },
        { name: 'automationRules', indexes: ['trigger', 'isActive'] },
        { name: 'coupons', indexes: ['code'] },
        { name: 'promotions', indexes: ['active'] },
        { name: 'fiscalConfig', indexes: [] },
        { name: 'syncQueue', indexes: ['status', 'type'] },
        { name: 'employees', indexes: ['status'] },
        { name: 'auditLogs', indexes: ['timestamp', 'module'] },
        { name: 'deliveryZones', indexes: ['neighborhood'] },
        { name: 'storeSettings', indexes: [] },
        { name: 'users', indexes: ['username'] },
        { name: 'shortcuts', indexes: ['key'] },
        { name: 'appConfig', indexes: [] }
      ];

      stores.forEach(storeConfig => {
        let store;
        if (!database.objectStoreNames.contains(storeConfig.name as any)) {
          store = database.createObjectStore(storeConfig.name as any, { keyPath: 'id' });
        } else {
          store = transaction.objectStore(storeConfig.name as any);
        }

        storeConfig.indexes.forEach(indexName => {
          if (!store.indexNames.contains(indexName)) {
            store.createIndex(indexName, indexName);
          }
        });
      });
    },
  });

  // Seed Initial Users if not exists
  const userCount = await db.count('users');
  if (userCount === 0) {
      await db.add('users', {
          id: uuidv4(),
          username: 'admin',
          password: '1234',
          role: 'ADMIN',
          permissions: ['pos', 'erp', 'crm', 'fiscal'],
          active: true
      });
      await db.add('users', {
          id: uuidv4(),
          username: 'defalt',
          password: '1234',
          role: 'OPERATOR',
          permissions: ['pos'],
          active: true
      });
  }

  // Seed Default Config
  const configCount = await db.count('appConfig');
  if (configCount === 0) {
    await db.add('appConfig', {
      id: 'main',
      companyName: 'Bem Estar PDV',
      autoAddOnBarcodeMatch: true,
      defaultPrintReceipt: true,
      theme: 'system'
    });
  }

  // Seed Default Shortcuts
  const shortcutCount = await db.count('shortcuts');
  if (shortcutCount === 0) {
    const defaultShortcuts = [
      { id: uuidv4(), key: 'F1', action: 'OPEN_CUSTOMER_MODAL', label: 'Adicionar Cliente' },
      { id: uuidv4(), key: 'F2', action: 'OPEN_PRODUCT_SEARCH', label: 'Pesquisar Produto' },
      { id: uuidv4(), key: 'F3', action: 'PARK_SALE', label: 'Salvar Pedido' },
      { id: uuidv4(), key: 'F4', action: 'OPEN_CASH_OPS', label: 'Movimentar Caixa' },
      { id: uuidv4(), key: 'F5', action: 'FINALIZE_SALE', label: 'Finalizar Venda' },
      { id: uuidv4(), key: 'F6', action: 'CLEAR_CART', label: 'Limpar Carrinho' },
      { id: uuidv4(), key: 'F10', action: 'OPEN_SETTINGS', label: 'Configurações' },
    ];
    for (const s of defaultShortcuts) {
      await db.add('shortcuts', s);
    }
  }

  // Seed Initial Products if not exists
  const productCount = await db.count('products');
  if (productCount === 0) {
    await seedInitialProducts();
  }
}

export async function exportFullBackup() {
    const stores: (keyof AppDB)[] = [
        'products', 'categories', 'sales', 'customers', 'suppliers', 
        'expenses', 'employees', 'deliveryZones', 
        'inventoryLots', 'inventoryAdjustments', 'storeSettings', 
        'coupons', 'segments', 'campaigns', 'promotions', 'cashSessions', 'cashOperations'
    ];
    
    const backupData: any = {};

    for (const store of stores) {
        backupData[store] = await db.getAll(store as any);
    }

    const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BACKUP_TOTAL_BEMESTAR_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export async function importFullBackup(jsonContent: string) {
    const backupData = JSON.parse(jsonContent);
    const stores = Object.keys(backupData);

    for (const storeName of stores) {
        const dataArray = backupData[storeName];
        if (Array.isArray(dataArray) && db.objectStoreNames.contains(storeName as any)) {
            const tx = db.transaction(storeName as any, 'readwrite');
            for (const item of dataArray) {
                await tx.store.put(item);
            }
            await tx.done;
        }
    }
}

export { db };
