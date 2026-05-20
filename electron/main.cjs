const { app, BrowserWindow, globalShortcut } = require('electron'); // ← added globalShortcut
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

function waitForBackend(url, retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get(url, (res) => {
        resolve(); // backend is up
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
console.log('USER_DATA_PATH set to:', process.env.USER_DATA_PATH);

let mainWindow = null;
let serverProcess = null;

function startBackend() {
  const isDev = !app.isPackaged;
  let backendPath;

  console.log(`Starting backend in ${isDev ? 'development' : 'production'} mode`);
  console.log('App is packaged:', app.isPackaged);
  console.log('Resources path:', process.resourcesPath);

  if (isDev) {
    backendPath = path.join(__dirname, '../server/src/index.ts');
    console.log(`Looking for dev backend at: ${backendPath}`);
    if (!fs.existsSync(backendPath)) {
      console.error(`Backend not found at: ${backendPath}`);
      return;
    }
    serverProcess = spawn('npx.cmd', ['tsx', backendPath], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, ELECTRON_RUNNING: 'true', PORT: '3000' }
    });
  } else {
    const possiblePaths = [
      path.join(process.resourcesPath, 'server/index.cjs'),
      path.join(__dirname, './server/dist/index.cjs'),
      path.join(process.resourcesPath, 'app.asar/server/index.cjs')
    ];

    console.log('Trying possible backend paths:', possiblePaths);

    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        backendPath = testPath;
        console.log(`Found backend at: ${backendPath}`);
        break;
      }
    }

    if (!backendPath) {
      console.error('Server not found in any location');
      return;
    }

    const userDataPath = app.getPath('userData');
    const nodePath = path.join(process.resourcesPath, 'node_modules');
    const electronNodePath = process.execPath;

    serverProcess = spawn(electronNodePath, [backendPath], {
      stdio: 'pipe',
      cwd: process.resourcesPath,
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'production',
        NODE_PATH: nodePath,
        RESOURCES_PATH: process.resourcesPath,
        USER_DATA_PATH: userDataPath,
        ELECTRON_RUN_AS_NODE: '1'
      }
    });
  }

  if (serverProcess) {
    serverProcess.stdout.on('data', (data) => {
      console.log(`[Backend]: ${data.toString()}`);
    });
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error]: ${data.toString()}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'POS Hardware',
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools(); // only in dev
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath, { hash: '/' });
    } else {
      console.error(`Frontend not found at: ${indexPath}`);
      app.quit();
    }
  }

  // ============================================
  // 🔒 DISABLE DEVTOOLS SHORTCUTS IN PRODUCTION
  // ============================================
  if (app.isPackaged) {
    // Prevent Ctrl+Shift+I (DevTools)
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      // Do nothing – shortcut is disabled
      console.log('DevTools shortcut blocked in production');
    });
    // Prevent F12
    globalShortcut.register('F12', () => {
      // Do nothing
    });
    // Prevent Ctrl+Shift+J (Console)
    globalShortcut.register('CommandOrControl+Shift+J', () => {
      // Do nothing
    });
    // Prevent Ctrl+Shift+C (Element inspector)
    globalShortcut.register('CommandOrControl+Shift+C', () => {
      // Do nothing
    });
  }

  // Optional: Disable right‑click context menu (prevents "Inspect")
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Wait for backend to actually be ready instead of hardcoded 3s
app.whenReady().then(() => {
  startBackend();
  waitForBackend('http://127.0.0.1:3000/api/health')
    .then(() => {
      console.log('Backend ready, creating window');
      createWindow();
    })
    .catch((err) => {
      console.error(err.message);
      createWindow(); // create anyway as fallback
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

// Clean up global shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

process.on('SIGINT', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});

process.on('SIGTERM', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});