
// services/databaseService.ts
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Product, Sale, CashSession, CashOperation, Supplier, Customer, Expense, Segment, Campaign, AutomationRule, InventoryLot, InventoryAdjustment, ParkedSale, Category, Coupon, FiscalConfig, SyncJob, Employee, AuditLog, DeliveryZone, StoreSettings, User, Promotion, StockMovement, StockAlert } from '../types';
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
}

let db: IDBPDatabase<AppDB>;

/**
 * Inicializa o banco de dados IndexedDB
 */
export async function initDB() {
  if (db) return; 

  db = await openDB<AppDB>('BemEstarPDV', 25, {
    upgrade(database, oldVersion, newVersion, transaction) {
      if (!database.objectStoreNames.contains('stockMovements')) {
        database.createObjectStore('stockMovements', { keyPath: 'id' }).createIndex('productId', 'productId');
      }
      if (!database.objectStoreNames.contains('stockAlerts')) {
        database.createObjectStore('stockAlerts', { keyPath: 'id' }).createIndex('productId', 'productId');
      }
      if (!database.objectStoreNames.contains('products')) {
        database.createObjectStore('products', { keyPath: 'id' }).createIndex('name', 'name');
      }
      if (!database.objectStoreNames.contains('sales')) {
        database.createObjectStore('sales', { keyPath: 'id' }).createIndex('date', 'date');
      }
      if (!database.objectStoreNames.contains('cashSessions')) {
        database.createObjectStore('cashSessions', { keyPath: 'id' }).createIndex('openedAt', 'openedAt');
      }
      if (!database.objectStoreNames.contains('cashOperations')) {
        database.createObjectStore('cashOperations', { keyPath: 'id' }).createIndex('sessionId', 'sessionId');
      }
      if (!database.objectStoreNames.contains('suppliers')) {
        database.createObjectStore('suppliers', { keyPath: 'id' }).createIndex('cnpj', 'cnpj');
      }
      if (!database.objectStoreNames.contains('customers')) {
        database.createObjectStore('customers', { keyPath: 'id' }).createIndex('cpf', 'cpf');
      }
      if (!database.objectStoreNames.contains('expenses')) {
        database.createObjectStore('expenses', { keyPath: 'id' }).createIndex('dueDate', 'dueDate');
      }
      if (!database.objectStoreNames.contains('segments')) {
        database.createObjectStore('segments', { keyPath: 'id' }).createIndex('name', 'name');
      }
      if (!database.objectStoreNames.contains('campaigns')) {
        database.createObjectStore('campaigns', { keyPath: 'id' }).createIndex('name', 'name');
      }
      if (!database.objectStoreNames.contains('automationRules')) {
        database.createObjectStore('automationRules', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('inventoryLots')) {
        database.createObjectStore('inventoryLots', { keyPath: 'id' }).createIndex('productId', 'productId');
      }
      if (!database.objectStoreNames.contains('inventoryAdjustments')) {
        database.createObjectStore('inventoryAdjustments', { keyPath: 'id' }).createIndex('productId', 'productId');
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
        database.createObjectStore('syncQueue', { keyPath: 'id' }).createIndex('status', 'status');
      }
      if (!database.objectStoreNames.contains('employees')) {
        database.createObjectStore('employees', { keyPath: 'id' }).createIndex('status', 'status');
      }
      if (!database.objectStoreNames.contains('auditLogs')) {
        database.createObjectStore('auditLogs', { keyPath: 'id' }).createIndex('timestamp', 'timestamp');
      }

      if (!database.objectStoreNames.contains('deliveryZones')) {
        database.createObjectStore('deliveryZones', { keyPath: 'id' }).createIndex('neighborhood', 'neighborhood');
      }
      if (!database.objectStoreNames.contains('storeSettings')) {
        database.createObjectStore('storeSettings', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('users')) {
        database.createObjectStore('users', { keyPath: 'id' }).createIndex('username', 'username');
      }
      if (!database.objectStoreNames.contains('promotions')) {
        database.createObjectStore('promotions', { keyPath: 'id' }).createIndex('active', 'active');
      }
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
        if (Array.isArray(dataArray)) {
            const tx = db.transaction(storeName as any, 'readwrite');
            for (const item of dataArray) {
                await tx.store.put(item);
            }
            await tx.done;
        }
    }
}

export { db };
