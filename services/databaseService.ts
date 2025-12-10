
// services/databaseService.ts
// Este serviço é o coração do nosso sistema "local-first".
// Ele abstrai toda a complexidade de lidar com o IndexedDB,
// um banco de dados NoSQL disponível no navegador.
// Usamos a biblioteca 'idb' que é um wrapper moderno sobre a API IndexedDB,
// tornando-a muito mais fácil de usar com Promises e async/await.

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Product, Sale, CashSession, Supplier, Customer, Expense, Segment, Campaign, AutomationRule, InventoryLot, InventoryAdjustment, ParkedSale, Category, Coupon, FiscalConfig, SyncJob } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Definimos a "Schema" (estrutura) do nosso banco de dados.
// Isso fornece type-safety ao interagir com o DB.
// Cada chave aqui representa um "object store" (semelhante a uma tabela em SQL).
interface AppDB extends DBSchema {
  products: {
    key: string; // A chave primária é o 'id' do produto (string).
    value: Product; // O valor armazenado é um objeto 'Product'.
    indexes: { name: string; scaleCode: string; categoryId: string; supplierId: string; }; // Criamos um índice na propriedade 'name', 'scaleCode', 'categoryId' e 'supplierId'.
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { date: Date; customerId: string };
  };
  parkedSales: {
    key: string;
    value: ParkedSale;
    indexes: { createdAt: Date };
  };
  cashSessions: {
    key: string;
    value: CashSession;
    indexes: { startDate: Date };
  };
  // Tabela para Categorias
  categories: {
    key: string;
    value: Category;
    indexes: { name: string; };
  };
  // Tabelas do ERP
  suppliers: {
    key: string;
    value: Supplier;
    indexes: { name: string, cnpj: string }; // Adicionado índice para CNPJ
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { name: string; cpf: string };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { dueDate: Date; status: string };
  };
  // Tabelas de Estoque
  inventoryLots: {
      key: string;
      value: InventoryLot;
      indexes: { productId: string; expirationDate: string };
  };
  inventoryAdjustments: {
      key: string;
      value: InventoryAdjustment;
      indexes: { productId: string; date: Date };
  };
  // Novas tabelas para o CRM
  segments: {
    key: string;
    value: Segment;
    indexes: { name: string };
  };
  campaigns: {
    key: string;
    value: Campaign;
    indexes: { name: string; status: string };
  };
  automationRules: {
    key: string;
    value: AutomationRule;
    // Fix: Changed isActive from boolean to number to match the type definition and be a valid IndexedDB key.
    indexes: { trigger: string; isActive: number };
  };
  // Tabela para Cupons de Desconto
  coupons: {
    key: string;
    value: Coupon;
    indexes: { code: string };
  };
  // Tabela para Configuração Fiscal (singleton)
  fiscalConfig: {
    key: string;
    value: FiscalConfig;
  };
  // Fila de Sincronização Background
  syncQueue: {
      key: string;
      value: SyncJob;
      indexes: { status: string, type: string };
  };
}

// Variável global para manter a instância do banco de dados.
// Isso evita a necessidade de reabrir a conexão a cada operação.
let db: IDBPDatabase<AppDB>;

// Função de inicialização do banco de dados.
// É chamada no início da aplicação para garantir que o DB esteja pronto.
export async function initDB() {
  if (db) return; // Se o DB já estiver inicializado, não faz nada.

  // Abre (ou cria, se não existir) o banco de dados 'UseNaturalPDV'.
  // A versão foi incrementada para '13' para adicionar o índice de fornecedor.
  db = await openDB<AppDB>('UseNaturalPDV', 13, {
    // A função 'upgrade' é chamada quando o DB é criado pela primeira vez
    // ou quando a versão do schema é incrementada.
    upgrade(database, oldVersion, newVersion, transaction) {
      // Criação inicial
      if (oldVersion < 1) {
        const productStore = database.createObjectStore('products', { keyPath: 'id' });
        productStore.createIndex('name', 'name', { unique: false });

        const saleStore = database.createObjectStore('sales', { keyPath: 'id' });
        saleStore.createIndex('date', 'date');
        
        database.createObjectStore('cashSessions', { keyPath: 'id' });
      }
      
      // Upgrade da versão 1 para 2: Adiciona tabelas do ERP
      if (oldVersion < 2) {
        const supplierStore = database.createObjectStore('suppliers', { keyPath: 'id' });
        supplierStore.createIndex('name', 'name');

        const customerStore = database.createObjectStore('customers', { keyPath: 'id' });
        customerStore.createIndex('name', 'name');
        customerStore.createIndex('cpf', 'cpf', { unique: true });
        
        const expenseStore = database.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('dueDate', 'dueDate');
        expenseStore.createIndex('status', 'status');
        
        const saleStore = transaction.objectStore('sales');
        saleStore.createIndex('customerId', 'customerId');
      }
      
      // Upgrade da versão 2 para 3: Adiciona tabelas do CRM
      if (oldVersion < 3) {
        database.createObjectStore('segments', { keyPath: 'id' }).createIndex('name', 'name');
        const campaignStore = database.createObjectStore('campaigns', { keyPath: 'id' });
        campaignStore.createIndex('name', 'name');
        campaignStore.createIndex('status', 'status');
        const autoRuleStore = database.createObjectStore('automationRules', { keyPath: 'id' });
        autoRuleStore.createIndex('trigger', 'trigger');
        autoRuleStore.createIndex('isActive', 'isActive');
      }

      // Upgrade da versão 3 para 4: Adiciona tabelas de Controle de Estoque
      if (oldVersion < 4) {
          const lotStore = database.createObjectStore('inventoryLots', { keyPath: 'id' });
          lotStore.createIndex('productId', 'productId');
          lotStore.createIndex('expirationDate', 'expirationDate');

          const adjustmentStore = database.createObjectStore('inventoryAdjustments', { keyPath: 'id' });
          adjustmentStore.createIndex('productId', 'productId');
          adjustmentStore.createIndex('date', 'date');
      }

      // Upgrade da versão 4 para 5: Adiciona tabela de Vendas Salvas (Parked Sales)
      if (oldVersion < 5) {
          const parkedSaleStore = database.createObjectStore('parkedSales', { keyPath: 'id' });
          parkedSaleStore.createIndex('createdAt', 'createdAt');
      }

      // Upgrade da versão 5 para 6: Adiciona o índice 'scaleCode' de forma correta (não-único).
      if (oldVersion < 6) {
          const productStore = transaction.objectStore('products');
          if (!productStore.indexNames.contains('scaleCode')) {
             productStore.createIndex('scaleCode', 'scaleCode', { unique: false });
          }
      }

      // Upgrade da versão 6 para 7: Garante que o índice 'scaleCode' seja não-único para corrigir migrações problemáticas.
      if (oldVersion < 7) {
          const productStore = transaction.objectStore('products');
          if (productStore.indexNames.contains('scaleCode')) {
              productStore.deleteIndex('scaleCode');
          }
          productStore.createIndex('scaleCode', 'scaleCode', { unique: false });
      }

      // Upgrade da versão 7 para 8: Adiciona um índice único para o CNPJ de fornecedores.
      // Isso impede a criação de fornecedores duplicados durante a importação de NF-e.
      if (oldVersion < 8) {
        const supplierStore = transaction.objectStore('suppliers');
        if (!supplierStore.indexNames.contains('cnpj')) {
          supplierStore.createIndex('cnpj', 'cnpj', { unique: true });
        }
      }

      // Upgrade da versão 8 para 9: Adiciona a gestão de categorias.
      if (oldVersion < 9) {
        const categoryStore = database.createObjectStore('categories', { keyPath: 'id' });
        categoryStore.createIndex('name', 'name', { unique: true });

        const productStore = transaction.objectStore('products');
        if (!productStore.indexNames.contains('categoryId')) {
            productStore.createIndex('categoryId', 'categoryId', { unique: false });
        }
      }
      
      // Upgrade da versão 9 para 10: Adiciona a gestão de cupons.
      if (oldVersion < 10) {
        const couponStore = database.createObjectStore('coupons', { keyPath: 'id' });
        couponStore.createIndex('code', 'code', { unique: true });
      }

      // Upgrade da versão 10 para 11: Adiciona a tabela de configuração fiscal.
      if (oldVersion < 11) {
        database.createObjectStore('fiscalConfig', { keyPath: 'id' });
      }

      // Upgrade da versão 11 para 12: Adiciona a tabela de fila de sincronização.
      if (oldVersion < 12) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('status', 'status', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // Upgrade da versão 12 para 13: Adiciona o índice 'supplierId' aos produtos.
      if (oldVersion < 13) {
        const productStore = transaction.objectStore('products');
        if (!productStore.indexNames.contains('supplierId')) {
            productStore.createIndex('supplierId', 'supplierId', { unique: false });
        }
      }
    },
  });

  // Após a inicialização, verificamos se precisamos popular os dados iniciais.
  await seedInitialData();
}

// Função para popular o banco de dados com dados de exemplo.
async function seedInitialData() {
    // Populando Categorias PRIMEIRO
    const categoryTx = db.transaction('categories', 'readwrite');
    let categories: Category[];
    if ((await categoryTx.store.count()) === 0) {
        console.log("Populando com categorias iniciais...");
        categories = [
            { id: uuidv4(), name: 'Grãos e Cereais' },
            { id: uuidv4(), name: 'Chás e Infusões' },
            { id: uuidv4(), name: 'Óleos e Temperos' },
            { id: uuidv4(), name: 'Snacks Saudáveis' },
        ];
        await Promise.all(categories.map(c => categoryTx.store.add(c)));
    } else {
        categories = await categoryTx.store.getAll();
    }
    await categoryTx.done;
    
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));

    // Populando Fornecedores PRIMEIRO
    const supplierTx = db.transaction('suppliers', 'readwrite');
    let suppliers: Supplier[] = [];
    if ((await supplierTx.store.count()) === 0) {
        console.log("Populando com fornecedores iniciais...");
        const initialSuppliers: Supplier[] = [
            { id: uuidv4(), name: 'Grãos & Cia', cnpj: '11.222.333/0001-44', contactPerson: 'Carlos', phone: '11 98765-4321' },
            { id: uuidv4(), name: 'Frutos da Terra Orgânicos', cnpj: '55.666.777/0001-88', contactPerson: 'Ana', email: 'contato@frutosdaterra.com' },
        ];
        await Promise.all(initialSuppliers.map(s => supplierTx.store.add(s)));
        suppliers = initialSuppliers;
    } else {
        suppliers = await supplierTx.store.getAll();
    }
    await supplierTx.done;
    const defaultSupplierId = suppliers.length > 0 ? suppliers[0].id : undefined;

    // DEPOIS, populando produtos e lotes
    const productAndLotTx = db.transaction(['products', 'inventoryLots'], 'readwrite');
    if ((await productAndLotTx.objectStore('products').count()) === 0) {
        console.log("Populando banco de dados com produtos e lotes iniciais...");
        const initialProducts: Product[] = [
            { id: '7891000123456', name: 'Granola Tradicional (kg)', price: 25.50, costPrice: 15.00, isBulk: true, scaleCode: '000001', stock: 100, minStock: 20, ncm: '1904.20.00', cfop: '5102', origin: '0', csosn_cst: '102', image: 'https://picsum.photos/seed/granola/200', categoryId: categoryMap.get('Grãos e Cereais'), supplierId: defaultSupplierId },
            { id: '7891000123457', name: 'Castanha do Pará (kg)', price: 89.90, costPrice: 60.00, isBulk: true, scaleCode: '000002', stock: 50, minStock: 10, ncm: '0801.22.00', cfop: '5102', origin: '0', csosn_cst: '102', image: 'https://picsum.photos/seed/castanha/200', categoryId: categoryMap.get('Grãos e Cereais'), supplierId: defaultSupplierId },
            { id: '7891000123458', name: 'Chá de Camomila (un)', price: 12.00, costPrice: 7.50, isBulk: false, stock: 200, minStock: 50, ncm: '1211.90.90', cfop: '5102', origin: '0', csosn_cst: '102', image: 'https://picsum.photos/seed/cha/200', categoryId: categoryMap.get('Chás e Infusões') },
            { id: '7891000123459', name: 'Óleo de Coco (500ml)', price: 35.75, costPrice: 22.00, isBulk: false, stock: 80, minStock: 15, ncm: '1513.19.00', cfop: '5102', origin: '0', csosn_cst: '102', image: 'https://picsum.photos/seed/oleo/200', categoryId: categoryMap.get('Óleos e Temperos') },
            { id: '7891000123460', name: 'Barra de Cereal Orgânica', price: 4.99, costPrice: 2.80, isBulk: false, stock: 300, minStock: 100, ncm: '1704.90.90', cfop: '5102', origin: '0', csosn_cst: '102', image: 'https://picsum.photos/seed/barra/200', categoryId: categoryMap.get('Snacks Saudáveis') },
            { id: '7891000123461', name: 'Sal Rosa do Himalaia (kg)', price: 15.00, costPrice: 8.00, isBulk: true, scaleCode: '000003', stock: 150, minStock: 30, ncm: '2501.00.19', cfop: '5102', origin: '0', csosn_cst: '102', image: 'https://picsum.photos/seed/sal/200', categoryId: categoryMap.get('Óleos e Temperos') },
        ];
        
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const initialLots: InventoryLot[] = initialProducts.map(p => ({
            id: uuidv4(),
            productId: p.id,
            quantity: p.stock,
            entryDate: new Date(),
            expirationDate: futureDate,
            costPrice: p.costPrice || 0,
        }));
        
        await Promise.all([
            ...initialProducts.map(p => productAndLotTx.objectStore('products').add(p)),
            ...initialLots.map(l => productAndLotTx.objectStore('inventoryLots').add(l))
        ]);
    }
    await productAndLotTx.done;

    // Populando Clientes
    const customerTx = db.transaction('customers', 'readwrite');
    if ((await customerTx.store.count()) === 0) {
        console.log("Populando com clientes iniciais...");
        const today = new Date();
        const initialCustomers: Customer[] = [
            { id: uuidv4(), name: 'João da Silva', cpf: '123.456.789-00', creditLimit: 500, email: 'joao.silva@example.com', birthDate: new Date(today.getFullYear() - 30, today.getMonth(), today.getDate() + 5) },
            { id: uuidv4(), name: 'Maria Oliveira', cpf: '987.654.321-00', creditLimit: 250, email: 'maria.o@email.com', birthDate: new Date(1990, 5, 15) },
            { id: uuidv4(), name: 'Cliente Inativo', cpf: '111.222.333-44', creditLimit: 100, email: 'inativo@example.com', birthDate: new Date(1985, 8, 20) },
        ];
        await Promise.all(initialCustomers.map(c => customerTx.store.add(c)));
        await customerTx.done;
    }
}


// Exportamos a instância do DB para ser usada por outros serviços/repositórios.
export { db };
