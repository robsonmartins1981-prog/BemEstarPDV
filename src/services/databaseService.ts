
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

  db = await openDB<AppDB>('BemEstarPDV', 26, {
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
        { name: 'users', indexes: ['username'] }
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
