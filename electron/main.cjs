const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

function waitForBackend(url, retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, () => {
        resolve();
      }).on('error', () => {
        if (retries-- > 0) {
          setTimeout(attempt, delay);
        } else {
          reject(new Error('Backend did not start in time'));
        }
      });
    };

    attempt();
  });
}

process.env.USER_DATA_PATH = app.getPath('userData');

console.log('USER_DATA_PATH:', process.env.USER_DATA_PATH);

let mainWindow = null;
let serverProcess = null;

function startBackend() {
  const isDev = !app.isPackaged;

  console.log(
    `Starting backend in ${isDev ? 'development' : 'production'} mode`
  );

  // =====================================================
  // DEVELOPMENT MODE
  // =====================================================
  // DO NOT start backend here.
  // npm run backend already starts it.
  // Starting another backend causes DB conflicts.
  // =====================================================

  if (isDev) {
    console.log('Development mode: using existing backend');
    return;
  }

  // =====================================================
  // PRODUCTION MODE
  // =====================================================

  let backendPath;

  const possiblePaths = [
    path.join(process.resourcesPath, 'server/index.cjs'),
    path.join(process.resourcesPath, 'app.asar/server/index.cjs'),
    path.join(__dirname, './server/dist/index.cjs')
  ];

  console.log('Trying backend paths:', possiblePaths);

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      backendPath = testPath;
      console.log('Found backend:', backendPath);
      break;
    }
  }

  if (!backendPath) {
    console.error('Backend not found');
    return;
  }

  const electronNodePath = process.execPath;

  serverProcess = spawn(
    electronNodePath,
    [backendPath],
    {
      stdio: 'pipe',
      windowsHide: true,
      env: {
        ...process.env,

        ELECTRON_RUN_AS_NODE: '1',

        NODE_ENV: 'production',
        PORT: '3000',

        APP_TYPE: 'hardware',
        APP_DB_NAME: 'pos_hardware.db',

        USER_DATA_PATH: app.getPath('userData')
      }
    }
  );

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Backend]: ${data.toString()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error]: ${data.toString()}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,

    title: 'POS Hardware',

    icon: path.join(__dirname, '../assets/icon.ico'),

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');

    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath, {
        hash: '/'
      });
    } else {
      console.error('Frontend build not found');
      app.quit();
    }
  }

  // Disable inspect/devtools in production
  if (app.isPackaged) {
    globalShortcut.register('CommandOrControl+Shift+I', () => {});
    globalShortcut.register('F12', () => {});
    globalShortcut.register('CommandOrControl+Shift+J', () => {});
    globalShortcut.register('CommandOrControl+Shift+C', () => {});
  }

  // Disable right click
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();

  waitForBackend('http://127.0.0.1:3000/api/health')
    .then(() => {
      console.log('Backend ready');
      createWindow();
    })
    .catch((err) => {
      console.error(err.message);
      createWindow();
    });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

process.on('SIGINT', () => {
  if (serverProcess) {
    serverProcess.kill();
  }

  app.quit();
});

process.on('SIGTERM', () => {
  if (serverProcess) {
    serverProcess.kill();
  }

  app.quit();
});