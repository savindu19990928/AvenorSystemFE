const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged || process.argv.includes('--dev');

let mainWindow = null;

const iconPath = path.join(__dirname, 'logo.png');

// Configure autoUpdater settings
// On macOS, native Squirrel.Mac auto-download triggers an Apple ShipIt code signature error on unsigned builds.
// We disable autoDownload on macOS so we can download the DMG installer directly; keep true on Windows for silent NSIS updates.
autoUpdater.autoDownload = process.platform !== 'darwin';
autoUpdater.autoInstallOnAppQuit = process.platform !== 'darwin';

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

// Helpers for authenticated GitHub release asset resolution & pre-signed downloads
async function getReleaseAsset(version, arch = process.arch) {
  const token = loadGitHubToken();
  const tag = version ? (version.startsWith('v') ? version : `v${version}`) : null;
  const endpoint = tag
    ? `https://api.github.com/repos/savindu19990928/AvenorSystemFE/releases/tags/${tag}`
    : 'https://api.github.com/repos/savindu19990928/AvenorSystemFE/releases/latest';

  const res = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AvenorSystem-Updater',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API returned HTTP ${res.status}`);
  }
  const data = await res.json();
  const isMac = process.platform === 'darwin';
  const targetArch = arch === 'arm64' ? 'arm64' : 'x64';

  let asset = null;
  if (isMac) {
    asset = data.assets.find((a) => a.name.includes(targetArch) && a.name.endsWith('.dmg'));
    if (!asset) {
      asset = data.assets.find((a) => a.name.endsWith('.dmg'));
    }
  } else {
    asset = data.assets.find((a) => a.name.endsWith('.exe'));
  }

  return { asset, version: data.tag_name ? data.tag_name.replace(/^v/, '') : data.name };
}

async function getSignedDownloadUrl(asset) {
  const token = loadGitHubToken();
  const res = await fetch(asset.url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/octet-stream',
      'User-Agent': 'AvenorSystem-Updater',
    },
    redirect: 'manual',
  });
  return res.headers.get('location') || asset.browser_download_url;
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

  let downloadedMacDmgPath = null;
  let isMacDownloading = false;

  async function startMacDmgDownload(version) {
    if (isMacDownloading) {
      console.log('[AutoUpdater] macOS download is already in progress');
      return { status: 'downloading' };
    }
    isMacDownloading = true;

    try {
      const targetVersion = version || lastAvailableVersion;
      const { asset, version: releaseVer } = await getReleaseAsset(targetVersion, process.arch);
      if (!asset) {
        throw new Error(`No macOS DMG installer asset found for version ${targetVersion || 'latest'}`);
      }

      sendToRenderer('updater:status', {
        status: 'downloading',
        version: releaseVer,
        percent: 0,
        transferred: 0,
        total: asset.size,
      });

      const downloadsFolder = app.getPath('downloads');
      const targetFilePath = path.join(downloadsFolder, asset.name);

      console.log(`[AutoUpdater] Downloading ${asset.name} (${asset.size} bytes) to ${targetFilePath}`);

      const token = loadGitHubToken();
      const downloadRes = await fetch(asset.url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/octet-stream',
          'User-Agent': 'AvenorSystem-Updater',
        },
      });

      if (!downloadRes.ok) {
        throw new Error(`Failed to stream download: HTTP ${downloadRes.status}`);
      }

      const fileStream = fs.createWriteStream(targetFilePath);
      const totalBytes = asset.size || parseInt(downloadRes.headers.get('content-length') || '0', 10);
      let transferredBytes = 0;
      let lastPercent = 0;
      let lastTime = Date.now();
      let bytesSinceLastTime = 0;

      const reader = downloadRes.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        fileStream.write(Buffer.from(value));
        transferredBytes += value.length;
        bytesSinceLastTime += value.length;

        const now = Date.now();
        if (now - lastTime >= 400) {
          const bytesPerSecond = Math.round((bytesSinceLastTime / (now - lastTime)) * 1000);
          bytesSinceLastTime = 0;
          lastTime = now;

          const percent = totalBytes > 0 ? Math.round((transferredBytes / totalBytes) * 100) : 0;
          if (percent !== lastPercent) {
            lastPercent = percent;
            sendToRenderer('updater:status', {
              status: 'downloading',
              version: releaseVer,
              percent,
              transferred: transferredBytes,
              total: totalBytes,
              bytesPerSecond,
            });
          }
        }
      }

      fileStream.end();
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });

      downloadedMacDmgPath = targetFilePath;
      isMacDownloading = false;

      console.log(`[AutoUpdater] macOS update DMG downloaded successfully: ${targetFilePath}`);

      sendToRenderer('updater:status', {
        status: 'downloaded',
        version: releaseVer,
        isMac: true,
        filePath: targetFilePath,
      });

      // Native dialog prompt for macOS
      if (mainWindow && !mainWindow.isDestroyed()) {
        dialog
          .showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Downloaded',
            message: `Avenor System v${releaseVer} has been downloaded.`,
            detail: 'Click "Open DMG Installer" to open the DMG disk image. You can then drag Avenor System into Applications to update.',
            buttons: ['Open DMG Installer', 'Later'],
            defaultId: 0,
            cancelId: 1,
          })
          .then(({ response }) => {
            if (response === 0) {
              shell.openPath(targetFilePath);
            }
          });
      }

      return { status: 'downloaded', filePath: targetFilePath, version: releaseVer };
    } catch (err) {
      isMacDownloading = false;
      const msg = err ? (err.message || err.toString()) : 'Download failed';
      console.error('[AutoUpdater] macOS download failed:', msg);
      sendToRenderer('updater:status', {
        status: 'error',
        message: 'Failed to download macOS update: ' + msg,
      });
      throw err;
    }
  }

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    lastAvailableVersion = info.version;
    lastReleaseNotes = info.releaseNotes;

    if (process.platform === 'darwin') {
      sendToRenderer('updater:status', {
        status: 'mac-manual-update',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    } else {
      sendToRenderer('updater:status', {
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    }
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

    // If release exists on GitHub but no installer manifest (latest.yml / latest-mac.yml) has been uploaded yet
    if (errMsg.includes('Cannot find latest.yml') || errMsg.includes('Cannot find latest-mac.yml')) {
      console.log('[AutoUpdater] Release exists on GitHub, but update package manifest for this platform has not been uploaded yet.');
      sendToRenderer('updater:status', {
        status: 'not-available',
        version: app.getVersion(),
        message: 'No update package available for this platform yet.',
      });
      return;
    }

    console.error('[AutoUpdater] Error:', errMsg);

    // On macOS, if Squirrel.Mac reports a code signature limitation (e.g. running unsigned)
    if (
      process.platform === 'darwin' &&
      (errMsg.includes('code signature') || errMsg.includes('ShipIt') || errMsg.includes('Could not get code signature'))
    ) {
      console.log('[AutoUpdater] macOS code signature check intercepted. Offering direct DMG update.');
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
            detail: 'Click "Download Update" to start downloading the DMG installer directly.',
            buttons: ['Download Update', 'Download via Browser', 'Later'],
            defaultId: 0,
            cancelId: 2,
          })
          .then(async ({ response }) => {
            if (response === 0) {
              startMacDmgDownload(lastAvailableVersion).catch(() => {});
            } else if (response === 1) {
              try {
                const { asset } = await getReleaseAsset(lastAvailableVersion, process.arch);
                if (asset) {
                  const signedUrl = await getSignedDownloadUrl(asset);
                  if (signedUrl) {
                    shell.openExternal(signedUrl);
                  }
                }
              } catch (openErr) {
                console.error('[AutoUpdater] Failed to get signed download URL:', openErr);
              }
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
        const msg = err?.message || err?.toString() || '';
        if (msg.includes('404') && msg.includes('releases/latest')) {
          console.log('[AutoUpdater] No releases found on GitHub repository yet (normal before initial release).');
          return;
        }
        console.error('[AutoUpdater] Check on launch failed:', msg);
      });
    }, 4000);

    // Periodically check every 4 hours while running
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        const msg = err?.message || err?.toString() || '';
        if (msg.includes('404') && msg.includes('releases/latest')) {
          return;
        }
        console.error('[AutoUpdater] Periodic check failed:', msg);
      });
    }, 4 * 60 * 60 * 1000);
  } else {
    console.log('[AutoUpdater] Running in development mode; automatic update checks skipped.');
  }

  // Handle IPC commands from renderer
  ipcMain.handle('updater:quit-and-install', () => {
    if (process.platform === 'darwin') {
      if (downloadedMacDmgPath && fs.existsSync(downloadedMacDmgPath)) {
        shell.openPath(downloadedMacDmgPath);
        app.quit();
        return;
      }
    }
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('updater:start-mac-download', (_event, version) => {
    return startMacDmgDownload(version);
  });

  ipcMain.handle('updater:open-mac-download', async (_event, version) => {
    try {
      const targetVer = version || lastAvailableVersion;
      const { asset } = await getReleaseAsset(targetVer, process.arch);
      if (asset) {
        const signedUrl = await getSignedDownloadUrl(asset);
        if (signedUrl) {
          console.log('[AutoUpdater] Opening pre-signed download URL in browser (no GitHub login required)');
          shell.openExternal(signedUrl);
          return { status: 'ok' };
        }
      }
    } catch (err) {
      console.error('[AutoUpdater] Failed to get signed download URL for browser:', err);
    }
    // Fallback: start in-app download directly
    return startMacDmgDownload(version);
  });
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
    const msg = err?.message || err?.toString() || '';
    if (msg.includes('404') && msg.includes('releases/latest')) {
      return { status: 'not-available', message: 'Current version is up to date.' };
    }
    if (msg.includes('Cannot find latest.yml') || msg.includes('Cannot find latest-mac.yml')) {
      return { status: 'not-available', message: 'Current version is up to date (no package update for this OS).' };
    }
    return { status: 'error', message: msg };
  }
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
