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

// Load GitHub token for private repository releases
const fs = require('fs');

function loadGitHubToken() {
  let token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

  if (!token) {
    const candidatePaths = [
      path.join(__dirname, 'github-token.txt'),
      path.join(process.resourcesPath, 'github-token.txt'),
      path.join(process.resourcesPath, 'electron', 'github-token.txt'),
    ];
    for (const tokenPath of candidatePaths) {
      try {
        if (fs.existsSync(tokenPath)) {
          token = fs.readFileSync(tokenPath, 'utf8').trim();
          console.log('[AutoUpdater] Loaded GitHub token from:', tokenPath);
          break;
        }
      } catch (err) {
        // continue searching
      }
    }
    if (!token) {
      console.warn('[AutoUpdater] github-token.txt not found in expected locations');
    }
  }

  if (token) {
    process.env.GH_TOKEN = token;
    process.env.GITHUB_TOKEN = token;
    autoUpdater.requestHeaders = {
      Authorization: `Bearer ${token}`,
    };

    try {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'savindu19990928',
        repo: 'AvenorSystemFE',
        private: true,
        token: token,
      });
    } catch (err) {
      console.error('[AutoUpdater] Failed to setFeedURL:', err);
    }
  }

  return token;
}

// Initial token load attempt
loadGitHubToken();

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, payload);
  }
}

let lastAvailableVersion = null;
let lastReleaseNotes = null;

function setupAutoUpdater() {
  loadGitHubToken();

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

    // If GitHub returns 404 (no releases published yet), treat as up-to-date / no release yet
    if (errMsg.includes('404') && errMsg.includes('releases/latest')) {
      console.log('[AutoUpdater] No releases found yet on GitHub repository. Waiting for initial release.');
      sendToRenderer('updater:status', {
        status: 'not-available',
        version: app.getVersion(),
      });
      return;
    }

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

  // Handle load failures gracefully
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Renderer] Failed to load: ${validatedURL} (Error ${errorCode}: ${errorDescription})`);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[Renderer] Process gone:', details);
  });

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devServerUrl).catch((err) => {
      console.error('[Renderer] loadURL failed:', err);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch((err) => {
      console.error('[Renderer] loadFile failed:', err);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Safety fallback: ensure window becomes visible even if ready-to-show takes too long
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.log('[Window] Showing window via safety fallback timer');
      mainWindow.show();
    }
  }, 2500);

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
