const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let mainWindow;
let scalePort;

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// --- IPC: IMPRESSÃO ---
ipcMain.handle('list-printers', async () => {
  return await mainWindow.webContents.getPrintersAsync();
});

ipcMain.handle('print-receipt', async (event, htmlContent, printerName) => {
  const printWindow = new BrowserWindow({ show: false });
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  
  return new Promise((resolve) => {
    printWindow.webContents.print({
      silent: true,
      deviceName: printerName,
      printBackground: true,
    }, (success, failureReason) => {
      printWindow.close();
      if (success) resolve({ success: true });
      else resolve({ success: false, error: failureReason });
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
