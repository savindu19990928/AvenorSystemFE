const { app, BrowserWindow, shell, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const {
  createMacUpdater,
  detectIsArm64Mac,
  selectMacFile,
  buildPublicReleaseDownloadUrl,
} = require('./mac-updater.cjs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged || process.argv.includes('--dev');

let mainWindow = null;

const iconPath = path.join(__dirname, 'logo.png');

// Configure autoUpdater settings
// On macOS, native Squirrel.Mac auto-download triggers an Apple ShipIt code signature error on unsigned builds.
// We disable autoDownload on macOS and use mac-updater.cjs for verified background ZIP updates; keep true on Windows for silent NSIS updates.
autoUpdater.autoDownload = process.platform !== 'darwin';
autoUpdater.autoInstallOnAppQuit = process.platform !== 'darwin';

// Custom logging for autoUpdater
autoUpdater.logger = {
  info: (...args) => console.log('[AutoUpdater]', ...args),
  warn: (...args) => console.warn('[AutoUpdater]', ...args),
  error: (...args) => console.error('[AutoUpdater]', ...args),
  debug: (...args) => console.log('[AutoUpdater:debug]', ...args),
};

const GITHUB_OWNER = 'savindu19990928';
const GITHUB_REPO = 'AvenorSystemFE';

function getOptionalGitHubToken() {
  return process.env.GH_TOKEN || process.env.GITHUB_TOKEN || null;
}

function getGitHubHeaders(accept) {
  const headers = {
    Accept: accept,
    'User-Agent': 'AvenorSystem-Updater',
  };
  const token = getOptionalGitHubToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function configureAutoUpdaterFeed() {
  const token = getOptionalGitHubToken();
  if (token) {
    autoUpdater.requestHeaders = {
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      private: false,
      ...(token ? { token } : {}),
    });
  } catch (err) {
    console.error('[AutoUpdater] Failed to setFeedURL:', err);
  }
}

// Helpers for GitHub public release asset resolution & downloads
async function getReleaseAsset(version, arch = process.arch, extension = null) {
  const tag = version ? (version.startsWith('v') ? version : `v${version}`) : null;
  const endpoint = tag
    ? `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${tag}`
    : `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

  const res = await fetch(endpoint, {
    headers: getGitHubHeaders('application/vnd.github.v3+json'),
  });
  if (!res.ok) {
    throw new Error(`GitHub API returned HTTP ${res.status}`);
  }
  const data = await res.json();
  const isMac = process.platform === 'darwin';
  const isArm64 = isMac
    ? detectIsArm64Mac({
        arch,
        runningUnderARM64Translation: app.runningUnderARM64Translation,
      })
    : false;
  const targetArch = isArm64 ? 'arm64' : 'x64';
  const targetExt = extension || (isMac ? '.dmg' : '.exe');

  let asset;
  if (isMac) {
    const extAssets = (data.assets || []).filter((a) => a.name.endsWith(targetExt));
    if (isArm64) {
      asset =
        extAssets.find((a) => a.name.includes('arm64')) ||
        extAssets.find((a) => !a.name.includes('x64')) ||
        extAssets[0];
    } else {
      const nonArm = extAssets.filter((a) => !a.name.includes('arm64'));
      asset = nonArm.find((a) => a.name.includes(targetArch)) || nonArm[0];
    }
  } else {
    asset = (data.assets || []).find((a) => a.name.endsWith(targetExt));
  }

  return { asset, version: data.tag_name ? data.tag_name.replace(/^v/, '') : data.name };
}

async function getReleaseDownloadUrl(asset) {
  if (!getOptionalGitHubToken() && asset.browser_download_url) {
    return asset.browser_download_url;
  }
  const res = await fetch(asset.url, {
    headers: getGitHubHeaders('application/octet-stream'),
    redirect: 'manual',
  });
  return res.headers.get('location') || asset.browser_download_url;
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send(channel, payload);
  }
}

let currentUpdaterStatus = null;
let lastAvailableVersion = null;
let lastReleaseNotes = null;
let lastUpdateInfo = null;
let lastPromptedMacVersion = null;
let isInstallingMacUpdate = false;
let macUpdater = null;

function emitUpdaterStatus(payload) {
  currentUpdaterStatus = payload;
  sendToRenderer('updater:status', payload);
}

async function triggerMacQuitAndInstall() {
  if (!macUpdater || !macUpdater.hasStagedUpdate()) {
    return { status: 'error', message: 'No downloaded update is ready to install.' };
  }
  const staged = macUpdater.getStagedUpdate();
  const prevStatus = currentUpdaterStatus;
  emitUpdaterStatus({
    status: 'installing',
    version: staged?.version,
    isMac: true,
    message: 'Applying update and restarting...',
  });

  try {
    const res = await macUpdater.installStagedUpdate({ relaunch: true, allowElevation: true });
    if (res && res.status === 'cancelled') {
      emitUpdaterStatus(
        prevStatus && prevStatus.status === 'downloaded'
          ? prevStatus
          : {
              status: 'downloaded',
              version: staged?.version,
              isMac: true,
              canAutoInstall: true,
              needsElevation: staged?.needsElevation,
              releaseNotes: lastReleaseNotes,
            }
      );
      return { status: 'cancelled' };
    }
    isInstallingMacUpdate = true;
    app.quit();
    return { status: 'installing', version: staged?.version };
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[AutoUpdater] Failed to install staged macOS update:', msg);
    emitUpdaterStatus({
      status: 'error',
      isMac: true,
      version: staged?.version,
      message: `Failed to install macOS update: ${msg}`,
    });
    return { status: 'error', message: msg };
  }
}

function setupAutoUpdater() {
  configureAutoUpdaterFeed();

  if (process.platform === 'darwin') {
    macUpdater = createMacUpdater({
      app,
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      getGitHubHeaders,
      getOptionalGitHubToken,
      getReleaseAsset,
      onStatus: emitUpdaterStatus,
      onReadyToInstall: (staged) => {
        if (mainWindow && !mainWindow.isDestroyed() && lastPromptedMacVersion !== staged.version) {
          lastPromptedMacVersion = staged.version;
          const detail = staged.needsElevation
            ? 'Click "Restart and Update" to apply the update and relaunch the app. macOS may ask for your administrator password to update /Applications.'
            : 'Would you like to restart and apply the update now?\n\nIf you select Later, the update will be applied automatically the next time you quit the application.';
          dialog
            .showMessageBox(mainWindow, {
              type: 'info',
              title: 'Update Ready to Install',
              message: `Avenor System v${staged.version} has been downloaded.`,
              detail,
              buttons: ['Restart and Update', 'Later'],
              defaultId: 0,
              cancelId: 1,
            })
            .then(({ response }) => {
              if (response === 0) {
                triggerMacQuitAndInstall().catch((err) => {
                  console.error('[AutoUpdater] macOS quit-and-install failed:', err);
                });
              }
            });
        }
      },
    });
    macUpdater.cleanupStaleCache();
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
    emitUpdaterStatus({ status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    lastAvailableVersion = info.version;
    lastReleaseNotes = info.releaseNotes;
    lastUpdateInfo = info;

    const cleanVer = info.version ? String(info.version).replace(/^v/, '') : null;
    const alreadyStaged =
      process.platform === 'darwin' &&
      macUpdater &&
      cleanVer &&
      macUpdater.hasStagedUpdate() &&
      macUpdater.getStagedUpdate()?.version === cleanVer;

    if (!alreadyStaged) {
      emitUpdaterStatus({
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
        isMac: process.platform === 'darwin',
      });
    }

    if (process.platform === 'darwin' && macUpdater) {
      macUpdater.downloadAndStageUpdate(info).catch(() => {});
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] Update not available. Current version is up to date.');
    emitUpdaterStatus({
      status: 'not-available',
      version: app.getVersion(),
    });
  });

  autoUpdater.on('error', (err) => {
    const errMsg = err ? (err.message || err.toString()) : '';

    // If GitHub returns 404 (no releases published yet), treat as up-to-date / no release yet
    if (errMsg.includes('404') && errMsg.includes('releases/latest')) {
      console.log('[AutoUpdater] No releases found yet on GitHub repository. Waiting for initial release.');
      emitUpdaterStatus({
        status: 'not-available',
        version: app.getVersion(),
      });
      return;
    }

    // If release exists on GitHub but no installer manifest (latest.yml / latest-mac.yml) has been uploaded yet
    if (errMsg.includes('Cannot find latest.yml') || errMsg.includes('Cannot find latest-mac.yml')) {
      console.log('[AutoUpdater] Release exists on GitHub, but update package manifest for this platform has not been uploaded yet.');
      emitUpdaterStatus({
        status: 'not-available',
        version: app.getVersion(),
        message: 'No update package available for this platform yet.',
      });
      return;
    }

    console.error('[AutoUpdater] Error:', errMsg);

    // On macOS, if Squirrel.Mac ever reports a code signature error, hand off to macUpdater
    if (
      process.platform === 'darwin' &&
      (errMsg.includes('code signature') || errMsg.includes('ShipIt') || errMsg.includes('Could not get code signature'))
    ) {
      if (macUpdater && (lastUpdateInfo || lastAvailableVersion)) {
        console.log('[AutoUpdater] Redirecting macOS update to verified ZIP updater.');
        macUpdater
          .downloadAndStageUpdate(lastUpdateInfo || { version: lastAvailableVersion, releaseNotes: lastReleaseNotes })
          .catch(() => {});
        return;
      }
      emitUpdaterStatus({
        status: 'mac-manual-update',
        version: lastAvailableVersion || undefined,
        message: 'A new update is available. Click below to download and install the macOS package.',
        releaseNotes: lastReleaseNotes,
      });
      return;
    }

    emitUpdaterStatus({
      status: 'error',
      isMac: process.platform === 'darwin',
      version: lastAvailableVersion || undefined,
      message: errMsg || 'Failed to check for updates',
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    emitUpdaterStatus({
      status: 'downloading',
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded successfully:', info.version);
    emitUpdaterStatus({
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

  // Silently apply staged non-elevated macOS updates on normal quit
  app.on('before-quit', () => {
    if (
      process.platform === 'darwin' &&
      !isInstallingMacUpdate &&
      macUpdater &&
      macUpdater.hasStagedUpdate() &&
      !macUpdater.stagedUpdateNeedsElevation()
    ) {
      try {
        isInstallingMacUpdate = true;
        macUpdater.installStagedUpdate({ relaunch: false, allowElevation: false });
      } catch (err) {
        console.error('[AutoUpdater] Failed to schedule macOS update on quit:', err);
      }
    }
  });

  // Handle IPC commands from renderer
  ipcMain.handle('updater:quit-and-install', async () => {
    if (process.platform === 'darwin') {
      return await triggerMacQuitAndInstall();
    }
    autoUpdater.quitAndInstall();
    return { status: 'installing' };
  });

  ipcMain.handle('updater:start-mac-download', async (_event, version) => {
    if (process.platform !== 'darwin' || !macUpdater) {
      return { status: 'error', message: 'macOS updater is only available on macOS.' };
    }
    const targetInfo =
      lastUpdateInfo && (!version || lastUpdateInfo.version === version)
        ? lastUpdateInfo
        : { version: version || lastAvailableVersion, releaseNotes: lastReleaseNotes };
    const staged = await macUpdater.downloadAndStageUpdate(targetInfo);
    return { status: 'downloaded', version: staged.version };
  });

  ipcMain.handle('updater:open-mac-download', async (_event, version) => {
    const targetVer = version || lastAvailableVersion;
    const isArm64 = detectIsArm64Mac({
      arch: process.arch,
      runningUnderARM64Translation: app.runningUnderARM64Translation,
    });
    const archLabel = isArm64 ? 'arm64' : 'x64';
    try {
      if (!getOptionalGitHubToken() && targetVer) {
        const dmgEntry = selectMacFile(lastUpdateInfo?.files, { isArm64, extension: 'dmg' });
        const dmgFileName = dmgEntry
          ? path.posix.basename(dmgEntry.url)
          : `Avenor-System-${String(targetVer).replace(/^v/, '')}-${archLabel}.dmg`;
        const directUrl = buildPublicReleaseDownloadUrl({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          tag: lastUpdateInfo?.tag,
          version: targetVer,
          fileName: dmgFileName,
        });
        console.log('[AutoUpdater] Opening release download URL in browser:', directUrl);
        await shell.openExternal(directUrl);
        return { status: 'ok' };
      }
      const { asset } = await getReleaseAsset(targetVer, archLabel, '.dmg');
      if (asset) {
        const downloadUrl = await getReleaseDownloadUrl(asset);
        if (downloadUrl) {
          console.log('[AutoUpdater] Opening release download URL in browser');
          await shell.openExternal(downloadUrl);
          return { status: 'ok' };
        }
      }
      return { status: 'error', message: 'No macOS DMG asset found for this release.' };
    } catch (err) {
      console.error('[AutoUpdater] Failed to resolve download URL for browser:', err);
      return { status: 'error', message: err?.message || 'Failed to open browser download.' };
    }
  });
}

// IPC Handlers for communication with the renderer process
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('updater:get-status', () => currentUpdaterStatus);

ipcMain.handle('updater:check', async () => {
  if (isDev) {
    return { status: 'dev-mode', message: 'Auto-update is disabled in development mode' };
  }
  if (process.platform === 'darwin' && macUpdater && macUpdater.isDownloading()) {
    if (currentUpdaterStatus) {
      emitUpdaterStatus(currentUpdaterStatus);
    }
    return {
      status: 'downloading',
      version: macUpdater.getCurrentDownloadVersion() || lastAvailableVersion || undefined,
      message: 'Update is already downloading in the background.',
    };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    if (!result || !result.isUpdateAvailable) {
      return {
        status: 'not-available',
        version: app.getVersion(),
        message: `You are up to date (v${app.getVersion()}).`,
      };
    }
    const targetVer = result.updateInfo?.version;
    if (
      process.platform === 'darwin' &&
      macUpdater &&
      macUpdater.hasStagedUpdate() &&
      macUpdater.getStagedUpdate()?.version === targetVer
    ) {
      const staged = macUpdater.getStagedUpdate();
      emitUpdaterStatus({
        status: 'downloaded',
        version: staged.version,
        isMac: true,
        canAutoInstall: true,
        needsElevation: staged.needsElevation,
        releaseNotes: lastReleaseNotes,
      });
      return {
        status: 'downloaded',
        version: staged.version,
        message: `Update v${staged.version} is ready to install.`,
      };
    }
    return {
      status: 'available',
      version: targetVer,
      message: `Update v${targetVer} found. Downloading in the background...`,
    };
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
