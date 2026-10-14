const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged || process.argv.includes('--dev');

let mainWindow = null;

const iconPath = path.join(__dirname, 'logo.png');

// Configure autoUpdater settings
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Custom logging for autoUpdater
autoUpdater.logger = {
  info: (...args) => console.log('[AutoUpdater]', ...args),
  warn: (...args) => console.warn('[AutoUpdater]', ...args),
  error: (...args) => console.error('[AutoUpdater]', ...args),
  debug: (...args) => console.log('[AutoUpdater:debug]', ...args),
};

// Optional token support for private GitHub repository releases
let ghToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!ghToken) {
  try {
    const fs = require('fs');
    const tokenFile = path.join(app.getPath('userData'), 'github-token.txt');
    if (fs.existsSync(tokenFile)) {
      ghToken = fs.readFileSync(tokenFile, 'utf8').trim();
    }
  } catch (err) {
    // Ignore error if file doesn't exist
  }
}

if (ghToken) {
  autoUpdater.requestHeaders = {
    Authorization: `Bearer ${ghToken}`,
  };
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, payload);
  }
}

let lastAvailableVersion = null;
let lastReleaseNotes = null;

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
    sendToRenderer('updater:status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    lastAvailableVersion = info.version;
    lastReleaseNotes = info.releaseNotes;
    sendToRenderer('updater:status', {
      status: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] Update not available. Current version is up to date.');
    sendToRenderer('updater:status', {
      status: 'not-available',
      version: app.getVersion(),
    });
  });

  autoUpdater.on('error', (err) => {
    const errMsg = err ? (err.message || err.toString()) : '';
    console.error('[AutoUpdater] Error:', errMsg);

    // On macOS, if Squirrel.Mac reports a code signature limitation (e.g. running unsigned)
    if (
      process.platform === 'darwin' &&
      (errMsg.includes('code signature') || errMsg.includes('ShipIt') || errMsg.includes('Could not get code signature'))
    ) {
      console.log('[AutoUpdater] macOS code signature check intercepted. Offering direct DMG 1-click update.');
      sendToRenderer('updater:status', {
        status: 'mac-manual-update',
        version: lastAvailableVersion || undefined,
        message: 'A new update is available. Download the updated macOS package to apply.',
        releaseNotes: lastReleaseNotes,
      });

      // Show native dialog for macOS
      if (mainWindow && !mainWindow.isDestroyed() && lastAvailableVersion) {
        dialog
          .showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available for macOS',
            message: `A new version of Avenor System (${lastAvailableVersion}) is available.`,
            detail: 'Click "Download Update" to open the new DMG installer.',
            buttons: ['Download Update', 'Later'],
            defaultId: 0,
            cancelId: 1,
          })
          .then(({ response }) => {
            if (response === 0) {
              const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
              const downloadUrl = `https://github.com/savindu19990928/AvenorSystemFE/releases/download/v${lastAvailableVersion}/Avenor-System-${lastAvailableVersion}-${arch}.dmg`;
              shell.openExternal(downloadUrl);
            }
          });
      }
      return;
    }

    sendToRenderer('updater:status', {
      status: 'error',
      message: errMsg || 'Failed to check for updates',
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    sendToRenderer('updater:status', {
      status: 'downloading',
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded successfully:', info.version);
    sendToRenderer('updater:status', {
      status: 'downloaded',
      version: info.version,
      releaseNotes: info.releaseNotes,
    });

    // Display native dialog prompt to restart now or update on exit
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready to Install',
          message: `A new version of Avenor System (${info.version}) has been downloaded.`,
          detail: 'Would you like to restart and apply the update now?\n\nIf you select Later, the update will be applied automatically next time you open the application.',
          buttons: ['Restart and Update', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        .then(({ response }) => {
          if (response === 0) {
            autoUpdater.quitAndInstall();
          }
        });
    }
  });

  // Automatically check for updates on startup when packaged (production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[AutoUpdater] Check on launch failed:', err?.message || err);
      });
    }, 4000);

    // Periodically check every 4 hours while running
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[AutoUpdater] Periodic check failed:', err?.message || err);
      });
    }, 4 * 60 * 60 * 1000);
  } else {
    console.log('[AutoUpdater] Running in development mode; automatic update checks skipped.');
  }
}

// IPC Handlers for communication with the renderer process
ipcMain.handle('app:get-version', () => app.getVersion());

ipcMain.handle('updater:check', async () => {
  if (isDev) {
    return { status: 'dev-mode', message: 'Auto-update is disabled in development mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'ok', version: result?.updateInfo?.version };
  } catch (err) {
    return { status: 'error', message: err?.message || err.toString() };
  }
});

ipcMain.handle('updater:quit-and-install', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('updater:open-mac-download', (_event, version) => {
  const targetVer = version || lastAvailableVersion;
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  const url = targetVer
    ? `https://github.com/savindu19990928/AvenorSystemFE/releases/download/v${targetVer}/Avenor-System-${targetVer}-${arch}.dmg`
    : 'https://github.com/savindu19990928/AvenorSystemFE/releases/latest';
  shell.openExternal(url);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Avenor System',
    icon: iconPath,
    backgroundColor: '#ffffff',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Ensure default menu bar is removed
  mainWindow.setMenuBarVisibility(false);
  if (typeof mainWindow.removeMenu === 'function') {
    mainWindow.removeMenu();
  }

  // Open external links (e.g. WhatsApp, web links) in the default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Set app name and disable default application menu bar
app.setName('Avenor System');
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(iconPath);
  }

  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    // macOS behavior: re-create window when dock icon is clicked and no windows open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, apps usually stay active in the dock until user hits Cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
