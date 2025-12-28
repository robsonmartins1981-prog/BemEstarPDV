
// services/databaseService.ts
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Product, Sale, CashSession, Supplier, Customer, Expense, Segment, Campaign, AutomationRule, InventoryLot, InventoryAdjustment, ParkedSale, Category, Coupon, FiscalConfig, SyncJob, Employee, AuditLog, FinancialEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppDB extends DBSchema {
  products: { key: string; value: Product; indexes: { name: string; scaleCode: string; categoryId: string; supplierId: string; }; };
  sales: { key: string; value: Sale; indexes: { date: Date; customerId: string }; };
  parkedSales: { key: string; value: ParkedSale; indexes: { createdAt: Date }; };
  cashSessions: { key: string; value: CashSession; indexes: { startDate: Date }; };
  categories: { key: string; value: Category; indexes: { name: string; }; };
  suppliers: { key: string; value: Supplier; indexes: { name: string, cnpj: string }; };
  customers: { key: string; value: Customer; indexes: { name: string; cpf: string }; };
  expenses: { key: string; value: Expense; indexes: { dueDate: Date; status: string }; };
  inventoryLots: { key: string; value: InventoryLot; indexes: { productId: string; expirationDate: string }; };
  inventoryAdjustments: { key: string; value: InventoryAdjustment; indexes: { productId: string; date: Date }; };
  segments: { key: string; value: Segment; indexes: { name: string }; };
  campaigns: { key: string; value: Campaign; indexes: { name: string; status: string }; };
  automationRules: { key: string; value: AutomationRule; indexes: { trigger: string; isActive: number }; };
  coupons: { key: string; value: Coupon; indexes: { code: string }; };
  fiscalConfig: { key: string; value: FiscalConfig; };
  syncQueue: { key: string; value: SyncJob; indexes: { status: string, type: string }; };
  employees: { key: string; value: Employee; indexes: { status: string }; };
  auditLogs: { key: string; value: AuditLog; indexes: { timestamp: Date, module: string }; };
  financialEntries: { key: string; value: FinancialEntry; indexes: { date: Date, type: string, category: string }; };
}

let db: IDBPDatabase<AppDB>;

export async function initDB() {
  if (db) return; 

  // Versão 17: Refatoração para garantir resiliência total das stores
  db = await openDB<AppDB>('UseNaturalPDV', 17, {
    upgrade(database, oldVersion, newVersion, transaction) {
      
      // 1. Criação de Stores Base se não existirem
      if (!database.objectStoreNames.contains('products')) {
        const productStore = database.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('name', 'name');
      }
      
      if (!database.objectStoreNames.contains('sales')) {
        const saleStore = database.createObjectStore('sales', { keyPath: 'id' });
        saleStore.createIndex('date', 'date');
      }

      if (!database.objectStoreNames.contains('cashSessions')) {
        database.createObjectStore('cashSessions', { keyPath: 'id' }).createIndex('startDate', 'startDate');
      }

      if (!database.objectStoreNames.contains('suppliers')) {
        database.createObjectStore('suppliers', { keyPath: 'id' }).createIndex('cnpj', 'cnpj');
      }

      if (!database.objectStoreNames.contains('customers')) {
        const customerStore = database.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('name', 'name');
        customerStore.createIndex('cpf', 'cpf');
      }

      if (!database.objectStoreNames.contains('expenses')) {
        const expenseStore = database.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('dueDate', 'dueDate');
        expenseStore.createIndex('status', 'status');
      }

      if (!database.objectStoreNames.contains('segments')) {
        database.createObjectStore('segments', { keyPath: 'id' }).createIndex('name', 'name');
      }

      if (!database.objectStoreNames.contains('campaigns')) {
        const campStore = database.createObjectStore('campaigns', { keyPath: 'id' });
        campStore.createIndex('name', 'name');
        campStore.createIndex('status', 'status');
      }

      if (!database.objectStoreNames.contains('automationRules')) {
        const autoStore = database.createObjectStore('automationRules', { keyPath: 'id' });
        autoStore.createIndex('trigger', 'trigger');
        autoStore.createIndex('isActive', 'isActive');
      }

      if (!database.objectStoreNames.contains('inventoryLots')) {
        const lotStore = database.createObjectStore('inventoryLots', { keyPath: 'id' });
        lotStore.createIndex('productId', 'productId');
        lotStore.createIndex('expirationDate', 'expirationDate');
      }

      if (!database.objectStoreNames.contains('inventoryAdjustments')) {
        const adjStore = database.createObjectStore('inventoryAdjustments', { keyPath: 'id' });
        adjStore.createIndex('productId', 'productId');
        adjStore.createIndex('date', 'date');
      }

      if (!database.objectStoreNames.contains('parkedSales')) {
        database.createObjectStore('parkedSales', { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
      }

      if (!database.objectStoreNames.contains('categories')) {
        database.createObjectStore('categories', { keyPath: 'id' }).createIndex('name', 'name');
      }

      if (!database.objectStoreNames.contains('coupons')) {
        database.createObjectStore('coupons', { keyPath: 'id' }).createIndex('code', 'code');
      }

      if (!database.objectStoreNames.contains('fiscalConfig')) {
        database.createObjectStore('fiscalConfig', { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('status', 'status');
        syncStore.createIndex('type', 'type');
      }

      if (!database.objectStoreNames.contains('employees')) {
        database.createObjectStore('employees', { keyPath: 'id' }).createIndex('status', 'status');
      }

      if (!database.objectStoreNames.contains('auditLogs')) {
        const auditStore = database.createObjectStore('auditLogs', { keyPath: 'id' });
        auditStore.createIndex('timestamp', 'timestamp');
      }

      if (!database.objectStoreNames.contains('financialEntries')) {
        database.createObjectStore('financialEntries', { keyPath: 'id' }).createIndex('date', 'date');
      }

      // 2. Garantia de Índices Secundários (Idempotente)
      const productStore = transaction.objectStore('products');
      if (!productStore.indexNames.contains('scaleCode')) productStore.createIndex('scaleCode', 'scaleCode');
      if (!productStore.indexNames.contains('categoryId')) productStore.createIndex('categoryId', 'categoryId');
      if (!productStore.indexNames.contains('supplierId')) productStore.createIndex('supplierId', 'supplierId');

      const saleStore = transaction.objectStore('sales');
      if (!saleStore.indexNames.contains('customerId')) saleStore.createIndex('customerId', 'customerId');
      
      const supplierStore = transaction.objectStore('suppliers');
      if (!supplierStore.indexNames.contains('name')) supplierStore.createIndex('name', 'name');
    },
  });
  await seedInitialData();
}

async function seedInitialData() {
    try {
        const categoryCount = await db.count('categories');
        if (categoryCount === 0) {
            const tx = db.transaction(['categories', 'products'], 'readwrite');
            const catStore = tx.objectStore('categories');
            const prodStore = tx.objectStore('products');
            
            await catStore.put({ id: uuidv4(), name: 'Produtos Naturais' });
            await catStore.put({ id: uuidv4(), name: 'Grãos' });
            
            // Produto ID '2' solicitado com NCM específico
            await prodStore.put({
                id: '2',
                name: 'Produto Exemplo (ID 2)',
                price: 19.90,
                costPrice: 10.00,
                stock: 50,
                isBulk: false,
                ncm: '12345678',
                image: 'https://picsum.photos/seed/prod2/200'
            });
            
            await tx.done;
        }
    } catch (e) {
        console.warn("Erro ao realizar seed de dados:", e);
    }
}

export { db };
