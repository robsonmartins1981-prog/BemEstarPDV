
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
  await seedInitialData();
}

async function seedInitialData() {
    try {
        const productCount = await db.count('products');
        if (productCount === 0) {
            const tx = db.transaction(['categories', 'products', 'inventoryLots'], 'readwrite');
            const catGranelId = uuidv4();
            const catEmpacotadosId = uuidv4();

            await tx.objectStore('categories').put({ id: catGranelId, name: 'Produtos a Granel' });
            await tx.objectStore('categories').put({ id: catEmpacotadosId, name: 'Cereais & Matinais' });

            const today = new Date();
            const futureVal = new Date();
            futureVal.setMonth(futureVal.getMonth() + 8);

            const seedProducts = [
                { name: "Castanha do Pará Inteira", brand: "Bem Estar", price: 89.90, cost: 45.00, isBulk: true },
                { name: "Nozes Quartos Extra", brand: "Importação Direct", price: 110.00, cost: 65.00, isBulk: true },
                { name: "Castanha de Caju W1 Salgada", brand: "Bem Estar", price: 78.50, cost: 40.00, isBulk: true },
                { name: "Amêndoa Chilena Crua", brand: "Naturals", price: 95.00, cost: 52.00, isBulk: true },
                { name: "Pistache com Casca Torrado", brand: "Naturals", price: 135.00, cost: 80.00, isBulk: true },
                { name: "Aveia em Flocos Finos 500g", brand: "Qualitá", price: 12.90, cost: 6.50, isBulk: false },
                { name: "Granola Artesanal com Mel", brand: "Cozinha Natural", price: 42.00, cost: 22.00, isBulk: true },
                { name: "Quinoa em Grãos Branca", brand: "Andes Food", price: 35.00, cost: 18.00, isBulk: true },
                { name: "Mix de Sementes Omega 3", brand: "Bem Estar", price: 55.00, cost: 28.00, isBulk: true },
                { name: "Cereal de Milho Sem Açúcar", brand: "CornFit", price: 24.90, cost: 11.00, isBulk: true }
            ];

            for (const item of seedProducts) {
                const pid = uuidv4();
                await tx.objectStore('products').put({
                    id: pid,
                    name: item.name,
                    brand: item.brand,
                    price: item.price,
                    costPrice: item.cost,
                    stock: 50,
                    isBulk: item.isBulk,
                    categoryId: item.isBulk ? catGranelId : catEmpacotadosId
                });
                
                await tx.objectStore('inventoryLots').put({
                    id: uuidv4(),
                    productId: pid,
                    quantity: 50,
                    entryDate: today,
                    expirationDate: futureVal,
                    costPrice: item.cost
                });
            }

            await tx.done;
        }
    } catch (e) {
        console.warn("Erro ao realizar seed de produtos naturais:", e);
    }
}

export { db };
