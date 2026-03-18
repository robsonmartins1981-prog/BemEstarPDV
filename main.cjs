const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const Database = require('better-sqlite3');

let mainWindow;
let scalePort;
let db;

// Caminho para o arquivo de configuração (onde salvamos o local do banco)
const configPath = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return { dbPath: null };
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

// --- IPC: SELEÇÃO DE DIRETÓRIO ---
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// --- IPC: CONFIGURAÇÃO DO BANCO ---
ipcMain.handle('get-db-config', () => {
  return loadConfig();
});

ipcMain.handle('set-db-path', (event, newPath) => {
  const config = loadConfig();
  config.dbPath = newPath;
  saveConfig(config);
  
  // Se mudar o caminho, tentamos reconectar
  try {
    initDatabase(newPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// --- INICIALIZAÇÃO DO SQLITE ---
function initDatabase(folderPath) {
  if (!folderPath) return;
  
  const dbFile = path.join(folderPath, 'bemestar_pdv.db');
  
  if (db) {
    db.close();
  }
  
  db = new Database(dbFile);
  
  // Criar tabelas básicas se não existirem (exemplo simplificado)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT,
      total REAL,
      items TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      stock INTEGER
    );
  `);
  
  console.log(`[SQLite] Banco de dados conectado em: ${dbFile}`);
}

// --- IPC: OPERAÇÕES DE BANCO ---
ipcMain.handle('db-query', (event, sql, params = []) => {
  if (!db) throw new Error('Banco de dados não inicializado.');
  return db.prepare(sql).all(params);
});

ipcMain.handle('db-run', (event, sql, params = []) => {
  if (!db) throw new Error('Banco de dados não inicializado.');
  return db.prepare(sql).run(params);
});

// --- IPC: BALANÇA ---
ipcMain.handle('list-ports', async () => {
  return await SerialPort.list();
});

// IPC para Conectar na Balança
ipcMain.handle('connect-scale', async (event, portPath, baudRate = 9600) => {
  try {
    if (scalePort && scalePort.isOpen) {
      scalePort.close();
    }

    scalePort = new SerialPort({ path: portPath, baudRate });
    const parser = scalePort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', (data) => {
      // Aqui tratamos o dado bruto da balança (ex: "ST,GS,+  0.500kg")
      // Cada balança tem um protocolo (Toledo, Filizola, etc.)
      const weight = parseFloat(data.replace(/[^0-9.]/g, ''));
      if (!isNaN(weight)) {
        mainWindow.webContents.send('scale-weight', weight);
      }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  // Inicializa o banco se já houver um caminho salvo
  const config = loadConfig();
  if (config.dbPath) {
    try {
      initDatabase(config.dbPath);
    } catch (e) {
      console.error('Erro ao inicializar banco salvo:', e);
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
