
// services/databaseService.ts
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Product, Sale, CashSession, Supplier, Customer, Expense, Segment, Campaign, AutomationRule, InventoryLot, InventoryAdjustment, ParkedSale, Category, Coupon, FiscalConfig, SyncJob, Employee, AuditLog, FinancialEntry, HistoricalCashEntry, DeliveryZone, StoreSettings } from '../types';
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
  historicalCash: { key: string; value: HistoricalCashEntry; indexes: { date: Date, terminal: string }; };
  auditLogs: { key: string; value: AuditLog; indexes: { timestamp: Date, module: string }; };
  financialEntries: { key: string; value: FinancialEntry; indexes: { date: Date, type: string, category: string }; };
  deliveryZones: { key: string; value: DeliveryZone; indexes: { neighborhood: string }; };
  storeSettings: { key: string; value: StoreSettings; };
}

let db: IDBPDatabase<AppDB>;

export async function initDB() {
  if (db) return; 

  db = await openDB<AppDB>('BemEstarPDV', 19, {
    upgrade(database, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        database.createObjectStore('products', { keyPath: 'id' }).createIndex('name', 'name');
        database.createObjectStore('sales', { keyPath: 'id' }).createIndex('date', 'date');
        database.createObjectStore('cashSessions', { keyPath: 'id' }).createIndex('startDate', 'startDate');
        database.createObjectStore('suppliers', { keyPath: 'id' }).createIndex('cnpj', 'cnpj');
        database.createObjectStore('customers', { keyPath: 'id' }).createIndex('cpf', 'cpf');
        database.createObjectStore('expenses', { keyPath: 'id' }).createIndex('dueDate', 'dueDate');
        database.createObjectStore('segments', { keyPath: 'id' }).createIndex('name', 'name');
        database.createObjectStore('campaigns', { keyPath: 'id' }).createIndex('name', 'name');
        database.createObjectStore('automationRules', { keyPath: 'id' });
        database.createObjectStore('inventoryLots', { keyPath: 'id' }).createIndex('productId', 'productId');
        database.createObjectStore('inventoryAdjustments', { keyPath: 'id' }).createIndex('productId', 'productId');
        database.createObjectStore('parkedSales', { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
        database.createObjectStore('categories', { keyPath: 'id' }).createIndex('name', 'name');
        database.createObjectStore('coupons', { keyPath: 'id' }).createIndex('code', 'code');
        database.createObjectStore('fiscalConfig', { keyPath: 'id' });
        database.createObjectStore('syncQueue', { keyPath: 'id' }).createIndex('status', 'status');
        database.createObjectStore('employees', { keyPath: 'id' }).createIndex('status', 'status');
        const cashStore = database.createObjectStore('historicalCash', { keyPath: 'id' });
        cashStore.createIndex('date', 'date');
        cashStore.createIndex('terminal', 'terminal');
        database.createObjectStore('auditLogs', { keyPath: 'id' }).createIndex('timestamp', 'timestamp');
        database.createObjectStore('financialEntries', { keyPath: 'id' }).createIndex('date', 'date');
      }

      if (!database.objectStoreNames.contains('deliveryZones')) {
        database.createObjectStore('deliveryZones', { keyPath: 'id' }).createIndex('neighborhood', 'neighborhood');
      }
      if (!database.objectStoreNames.contains('storeSettings')) {
        database.createObjectStore('storeSettings', { keyPath: 'id' });
      }
    },
  });
}

export async function exportFullBackup() {
    const stores: (keyof AppDB)[] = [
        'products', 'categories', 'sales', 'customers', 'suppliers', 
        'expenses', 'employees', 'historicalCash', 'deliveryZones', 
        'inventoryLots', 'inventoryAdjustments', 'storeSettings', 
        'coupons', 'segments', 'campaigns'
    ];
    
    const backupData: any = {};

    for (const store of stores) {
        backupData[store] = await db.getAll(store);
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
