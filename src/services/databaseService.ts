
// services/databaseService.ts
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Product, Sale, CashSession, CashOperation, Supplier, Customer, Expense, InventoryLot, InventoryAdjustment, ParkedSale, Category, FiscalConfig, Employee, AuditLog, StoreSettings, User, StockMovement, StockAlert, Shortcut, AppConfig, Terminal } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppDB extends DBSchema {
  products: { key: string; value: Product; indexes: { name: string; scaleCode: string; categoryId: string; supplierId: string; }; };
  sales: { key: string; value: Sale; indexes: { date: Date; customerId: string; sessionId: string }; };
  parkedSales: { key: string; value: ParkedSale; indexes: { createdAt: Date }; };
  cashSessions: { key: string; value: CashSession; indexes: { openedAt: string; status: string }; };
  cashOperations: { key: string; value: CashOperation; indexes: { sessionId: string; date: string }; };
  categories: { key: string; value: Category; indexes: { name: string; }; };
  suppliers: { key: string; value: Supplier; indexes: { name: string, cnpj: string }; };
  customers: { key: string; value: Customer; indexes: { name: string; cpf: string }; };
  expenses: { key: string; value: Expense; indexes: { dueDate: Date; purchaseDate: Date; status: string }; };
  inventoryLots: { key: string; value: InventoryLot; indexes: { productId: string; expirationDate: string }; };
  inventoryAdjustments: { key: string; value: InventoryAdjustment; indexes: { productId: string; date: Date }; };
  stockMovements: { key: string; value: StockMovement; indexes: { [key: string]: any }; };
  stockAlerts: { key: string; value: StockAlert; indexes: { [key: string]: any }; };
  fiscalConfig: { key: string; value: FiscalConfig; };
  employees: { key: string; value: Employee; indexes: { status: string }; };
  auditLogs: { key: string; value: AuditLog; indexes: { timestamp: Date, module: string }; };
  storeSettings: { key: string; value: StoreSettings; };
  users: { key: string; value: User; indexes: { username: string }; };
  terminals: { key: string; value: Terminal; indexes: { name: string }; };
  shortcuts: { key: string; value: Shortcut; indexes: { key: string }; };
  appConfig: { key: string; value: AppConfig; };
}

let db: IDBPDatabase<AppDB>;

/**
 * Inicializa o banco de dados IndexedDB
 */
export async function initDB() {
  if (db) return; 

  db = await openDB<AppDB>('BemEstarPDV', 30, {
    upgrade(database, oldVersion, newVersion, transaction) {
      const stores = [
        { name: 'products', indexes: ['name', 'scaleCode', 'categoryId', 'supplierId'] },
        { name: 'sales', indexes: ['date', 'customerId', 'sessionId'] },
        { name: 'parkedSales', indexes: ['createdAt'] },
        { name: 'cashSessions', indexes: ['openedAt', 'status'] },
        { name: 'cashOperations', indexes: ['sessionId', 'date'] },
        { name: 'categories', indexes: ['name'] },
        { name: 'suppliers', indexes: ['name', 'cnpj'] },
        { name: 'customers', indexes: ['name', 'cpf'] },
        { name: 'expenses', indexes: ['dueDate', 'purchaseDate', 'status'] },
        { name: 'inventoryLots', indexes: ['productId', 'expirationDate'] },
        { name: 'inventoryAdjustments', indexes: ['productId', 'date'] },
        { name: 'stockMovements', indexes: ['productId'] },
        { name: 'stockAlerts', indexes: ['productId'] },
        { name: 'fiscalConfig', indexes: [] },
        { name: 'employees', indexes: ['status'] },
        { name: 'auditLogs', indexes: ['timestamp', 'module'] },
        { name: 'storeSettings', indexes: [] },
        { name: 'users', indexes: ['username'] },
        { name: 'terminals', indexes: ['name'] },
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
          username: 'robsonmartins1981@gmail.com',
          password: 'admin',
          role: 'ADMIN',
          permissions: ['ALL'],
          active: true,
          fullName: 'Robson Martins'
      });
      await db.add('users', {
          id: uuidv4(),
          username: 'admin',
          password: '1234',
          role: 'ADMIN',
          permissions: ['ALL'],
          active: true
      });
      await db.add('users', {
          id: uuidv4(),
          username: 'default',
          password: '1234',
          role: 'USER_CAIXA',
          permissions: ['PDV'],
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
}

export async function exportFullBackup() {
    const stores: (keyof AppDB)[] = [
        'products', 'categories', 'sales', 'customers', 'suppliers', 
        'expenses', 'employees', 
        'inventoryLots', 'inventoryAdjustments', 'storeSettings', 
        'cashSessions', 'cashOperations'
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

export async function clearProductsAndInventory() {
  console.log('Iniciando limpeza de produtos e estoque...');
  if (!db) {
    await initDB();
  }
  
  const stores: (keyof AppDB)[] = [
    'products', 
    'categories', 
    'inventoryLots', 
    'inventoryAdjustments', 
    'stockMovements', 
    'stockAlerts'
  ];

  for (const storeName of stores) {
    try {
      if (db.objectStoreNames.contains(storeName as any)) {
        await db.clear(storeName as any);
        console.log(`Store ${storeName} limpa com sucesso.`);
      }
    } catch (error) {
      console.error(`Erro ao limpar store ${storeName}:`, error);
    }
  }
}

/**
 * Busca paginada no IndexedDB
 */
export async function getPaginated<T extends keyof AppDB>(
  storeName: T,
  limitCount: number = 50,
  offset: number = 0
): Promise<any[]> {
  if (!db) await initDB();
  const tx = db.transaction(storeName as any, 'readonly');
  const store = tx.objectStore(storeName as any);
  let cursor = await store.openCursor();
  const results: any[] = [];
  
  if (offset > 0 && cursor) {
    try {
      await cursor.advance(offset);
    } catch (e) {
      // Se o offset for maior que o total, cursor.advance falha
      return [];
    }
  }

  let count = 0;
  while (cursor && count < limitCount) {
    results.push(cursor.value);
    cursor = await cursor.continue();
    count++;
  }

  return results;
}

/**
 * Busca por índice no IndexedDB
 */
export async function searchByIndex<T extends keyof AppDB>(
  storeName: T,
  indexName: string,
  query: any
): Promise<any[]> {
  if (!db) await initDB();
  return db.getAllFromIndex(storeName as any, indexName as any, query);
}

export { db };
