const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');
const { execFile, execFileSync, spawn } = require('child_process');

/**
 * Detect whether the current macOS host is Apple Silicon (including apps running under Rosetta 2).
 */
function detectIsArm64Mac({
  arch = process.arch,
  runningUnderARM64Translation,
  platform = process.platform,
  execFileSyncImpl = execFileSync,
} = {}) {
  if (arch === 'arm64' || runningUnderARM64Translation === true) {
    return true;
  }
  if (platform !== 'darwin') {
    return false;
  }
  try {
    const out = execFileSyncImpl('/usr/sbin/sysctl', ['-in', 'sysctl.proc_translated'], {
      encoding: 'utf8',
      timeout: 2000,
    });
    return String(out).trim() === '1';
  } catch {
    return false;
  }
}

/**
 * Select the architecture-appropriate macOS release file entry from electron-updater UpdateInfo.files.
 */
function selectMacFile(files, { isArm64, extension = 'zip' } = {}) {
  const extSuffix = `.${String(extension).toLowerCase()}`;
  const matching = (files || []).filter(
    (file) => file && typeof file.url === 'string' && file.url.toLowerCase().endsWith(extSuffix)
  );
  if (matching.length === 0) {
    return null;
  }

  if (isArm64) {
    return (
      matching.find((file) => file.url.toLowerCase().includes('arm64')) ||
      matching.find((file) => !file.url.toLowerCase().includes('x64')) ||
      matching[0]
    );
  }

  const nonArm = matching.filter((file) => !file.url.toLowerCase().includes('arm64'));
  return nonArm.find((file) => file.url.toLowerCase().includes('x64')) || nonArm[0] || null;
}

/**
 * Build a direct public GitHub Release asset download URL without using api.github.com.
 */
function buildPublicReleaseDownloadUrl({ owner, repo, tag, version, fileName }) {
  const rawTag = tag || (version ? (String(version).startsWith('v') ? String(version) : `v${version}`) : '');
  const normalizedFileName = String(fileName || '').replace(/ /g, '-');
  return `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(rawTag)}/${encodeURIComponent(normalizedFileName)}`;
}

/**
 * Compare numeric major.minor.patch semver components (-1, 0, or 1).
 */
function compareVersions(a, b) {
  const parse = (val) => {
    const clean = String(val || '')
      .trim()
      .replace(/^v/i, '')
      .split(/[-+]/)[0];
    if (!clean) {
      return [0, 0, 0];
    }
    const parts = clean.split('.').map((n) => {
      const parsed = parseInt(n, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    });
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  };

  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

/**
 * Resolve the target .app bundle path to update, relocating read-only DMG or AppTranslocation launches to /Applications.
 */
function resolveTargetAppPath({ execPath = process.execPath, extractedAppName = 'Avenor System.app' } = {}) {
  const pathImpl = execPath && execPath.startsWith('/') ? path.posix : path;
  let current = execPath ? pathImpl.resolve(execPath) : '';
  let currentAppPath = null;

  while (current && current !== pathImpl.dirname(current)) {
    if (current.endsWith('.app')) {
      currentAppPath = current;
      break;
    }
    current = pathImpl.dirname(current);
  }

  const isReadOnlyOrTranslocated =
    !currentAppPath ||
    currentAppPath.startsWith('/Volumes/') ||
    currentAppPath.includes('/AppTranslocation/');

  if (isReadOnlyOrTranslocated) {
    return {
      targetAppPath: path.posix.join('/Applications', extractedAppName),
      currentAppPath,
      relocatedFromReadOnly: true,
    };
  }

  return {
    targetAppPath: currentAppPath,
    currentAppPath,
    relocatedFromReadOnly: false,
  };
}

/**
 * Check whether the target .app bundle and its parent directory are writable without elevation.
 */
function checkTargetWritable(
  targetAppPath,
  { accessSyncImpl = fs.accessSync, existsSyncImpl = fs.existsSync } = {}
) {
  if (!targetAppPath) {
    return false;
  }
  const pathImpl = targetAppPath.startsWith('/') ? path.posix : path;
  const parentDir = pathImpl.dirname(targetAppPath);
  try {
    accessSyncImpl(parentDir, fs.constants.W_OK);
    if (existsSyncImpl(targetAppPath)) {
      accessSyncImpl(targetAppPath, fs.constants.W_OK);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * POSIX single-quote shell escaping.
 */
function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

/**
 * Escape a string for inclusion inside an AppleScript double-quoted literal.
 */
function escapeAppleScriptString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Build the detached POSIX /bin/sh script (LF-only) that swaps the staged .app bundle after Electron exits.
 */
function buildInstallScriptContent() {
  return [
    '#!/bin/sh',
    'set -eu',
    '',
    'APP_PID="$1"',
    'STAGED_APP="$2"',
    'TARGET_APP="$3"',
    'RELAUNCH="$4"',
    'STAGING_DIR="$5"',
    'LOG_FILE="$6"',
    'RUN_USER="${7:-}"',
    '',
    'mkdir -p "$(dirname "$LOG_FILE")"',
    'exec >> "$LOG_FILE" 2>&1',
    '',
    'log() {',
    '  printf "[%s] %s\\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$1"',
    '}',
    '',
    'log "Starting macOS update installation (pid=$APP_PID target=$TARGET_APP relaunch=$RELAUNCH)"',
    '',
    'WAIT_COUNT=0',
    'while kill -0 "$APP_PID" 2>/dev/null; do',
    '  WAIT_COUNT=$((WAIT_COUNT + 1))',
    '  if [ "$WAIT_COUNT" -ge 150 ]; then',
    '    log "ERROR: Timed out waiting for PID $APP_PID to exit"',
    '    exit 1',
    '  fi',
    '  sleep 0.2',
    'done',
    '',
    'sleep 0.5',
    '',
    'if [ ! -d "$STAGED_APP" ] || [ ! -f "$STAGED_APP/Contents/Info.plist" ]; then',
    '  log "ERROR: Staged app bundle is invalid: $STAGED_APP"',
    '  exit 1',
    'fi',
    '',
    'TARGET_DIR="$(dirname "$TARGET_APP")"',
    'TARGET_NAME="$(basename "$TARGET_APP")"',
    'NEW_APP="${TARGET_DIR}/.${TARGET_NAME}.new.$$"',
    'BACKUP_APP="${TARGET_DIR}/.${TARGET_NAME}.backup.$$"',
    '',
    'mkdir -p "$TARGET_DIR"',
    'rm -rf "$NEW_APP" "$BACKUP_APP"',
    '',
    'log "Copying staged bundle via ditto to $NEW_APP"',
    '/usr/bin/ditto "$STAGED_APP" "$NEW_APP"',
    '/usr/bin/xattr -dr com.apple.quarantine "$NEW_APP" 2>/dev/null || true',
    '',
    'if [ ! -f "$NEW_APP/Contents/Info.plist" ]; then',
    '  log "ERROR: Copied app bundle missing Info.plist"',
    '  rm -rf "$NEW_APP"',
    '  exit 1',
    'fi',
    '',
    'HAD_EXISTING=0',
    'if [ -e "$TARGET_APP" ]; then',
    '  HAD_EXISTING=1',
    '  log "Backing up existing bundle to $BACKUP_APP"',
    '  /bin/mv "$TARGET_APP" "$BACKUP_APP"',
    'fi',
    '',
    'if ! /bin/mv "$NEW_APP" "$TARGET_APP"; then',
    '  log "ERROR: Failed to move new bundle into place; rolling back"',
    '  rm -rf "$NEW_APP"',
    '  if [ "$HAD_EXISTING" = "1" ] && [ -e "$BACKUP_APP" ]; then',
    '    /bin/mv "$BACKUP_APP" "$TARGET_APP" || true',
    '  fi',
    '  exit 1',
    'fi',
    '',
    'if [ "$(id -u)" = "0" ] && [ -n "$RUN_USER" ] && [ "$RUN_USER" != "root" ]; then',
    '  /usr/sbin/chown -R "${RUN_USER}:staff" "$TARGET_APP" 2>/dev/null || true',
    'fi',
    '',
    '/usr/bin/xattr -dr com.apple.quarantine "$TARGET_APP" 2>/dev/null || true',
    '/usr/bin/touch "$TARGET_APP" 2>/dev/null || true',
    '',
    'rm -rf "$BACKUP_APP"',
    'if [ "$(basename "$STAGING_DIR")" = "pending-mac-update" ]; then',
    '  rm -rf "$STAGING_DIR"',
    'fi',
    '',
    'log "Update swapped cleanly into $TARGET_APP"',
    '',
    'if [ "$RELAUNCH" = "1" ]; then',
    '  log "Relaunching updated application"',
    '  if [ "$(id -u)" = "0" ] && [ -n "$RUN_USER" ] && [ "$RUN_USER" != "root" ]; then',
    '    RUN_UID="$(id -u "$RUN_USER" 2>/dev/null || true)"',
    '    if [ -n "$RUN_UID" ]; then',
    '      /bin/launchctl asuser "$RUN_UID" /usr/bin/open "$TARGET_APP" || /usr/bin/sudo -u "$RUN_USER" /usr/bin/open "$TARGET_APP" || true',
    '    else',
    '      /usr/bin/sudo -u "$RUN_USER" /usr/bin/open "$TARGET_APP" || true',
    '    fi',
    '  else',
    '    /usr/bin/open "$TARGET_APP" || /usr/bin/open -n "$TARGET_APP" || true',
    '  fi',
    'fi',
    '',
    'log "Installation complete"',
    '',
  ].join('\n');
}

/**
 * Download a file via streaming pipeline to a .partial file, verify SHA-512 base64 digest, and atomically rename.
 */
async function downloadFileWithSha512({
  url,
  headers,
  destPath,
  expectedSha512,
  expectedSize,
  onProgress,
  fetchImpl = fetch,
}) {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  const partialPath = `${destPath}.partial`;

  try {
    const res = await fetchImpl(url, {
      headers,
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`Download failed with HTTP ${res.status}`);
    }
    if (!res.body) {
      throw new Error('Download response did not include a readable body stream');
    }

    const headerLength = parseInt(res.headers.get('content-length') || '0', 10);
    const totalBytes = expectedSize || (Number.isFinite(headerLength) ? headerLength : 0);

    const hash = crypto.createHash('sha512');
    let transferredBytes = 0;
    let lastReportTime = Date.now();
    let bytesSinceLastReport = 0;
    let lastReportedPercent = -1;

    const meter = new Transform({
      transform(chunk, _encoding, callback) {
        hash.update(chunk);
        transferredBytes += chunk.length;
        bytesSinceLastReport += chunk.length;

        if (typeof onProgress === 'function') {
          const now = Date.now();
          const elapsed = now - lastReportTime;
          const rawPercent = totalBytes > 0 ? Math.floor((transferredBytes / totalBytes) * 100) : 0;
          const cappedPercent = Math.min(99, rawPercent);

          if (elapsed >= 250 || cappedPercent !== lastReportedPercent) {
            const bytesPerSecond = elapsed > 0 ? Math.round((bytesSinceLastReport / elapsed) * 1000) : 0;
            if (elapsed >= 250) {
              lastReportTime = now;
              bytesSinceLastReport = 0;
            }
            lastReportedPercent = cappedPercent;
            onProgress({
              percent: cappedPercent,
              transferred: transferredBytes,
              total: totalBytes,
              bytesPerSecond,
            });
          }
        }
        callback(null, chunk);
      },
    });

    const sourceStream = typeof res.body.getReader === 'function' ? Readable.fromWeb(res.body) : res.body;
    const writeStream = fs.createWriteStream(partialPath);

    await pipeline(sourceStream, meter, writeStream);

    if (expectedSha512) {
      const actualSha512 = hash.digest('base64');
      if (actualSha512 !== expectedSha512) {
        throw new Error('Downloaded update archive failed SHA-512 integrity verification');
      }
    }

    await fs.promises.rename(partialPath, destPath);
    return { filePath: destPath, size: transferredBytes };
  } catch (err) {
    await fs.promises.rm(partialPath, { force: true }).catch(() => {});
    throw err;
  }
}

function runExecFile(execFileImpl, file, args) {
  return new Promise((resolve, reject) => {
    execFileImpl(file, args, (err, stdout, stderr) => {
      if (err) {
        const error = new Error(stderr?.trim() || err.message || `${file} failed`);
        error.code = err.code;
        error.cause = err;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Extract a macOS update .zip using native /usr/bin/ditto, locate the .app bundle, and strip quarantine attributes.
 */
async function extractMacZip(zipPath, extractDir, { execFileImpl = execFile } = {}) {
  await fs.promises.rm(extractDir, { recursive: true, force: true });
  await fs.promises.mkdir(extractDir, { recursive: true });

  await runExecFile(execFileImpl, '/usr/bin/ditto', ['-x', '-k', zipPath, extractDir]);

  const entries = await fs.promises.readdir(extractDir, { withFileTypes: true });
  const appEntry = entries.find((entry) => entry.isDirectory() && entry.name.endsWith('.app'));
  if (!appEntry) {
    throw new Error('No .app bundle found inside extracted macOS update archive');
  }

  const appPath = path.join(extractDir, appEntry.name);
  const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
  if (!fs.existsSync(infoPlistPath)) {
    throw new Error(`Extracted app bundle is missing Contents/Info.plist: ${appEntry.name}`);
  }

  await runExecFile(execFileImpl, '/usr/bin/xattr', ['-dr', 'com.apple.quarantine', appPath]).catch(() => {});

  return {
    appPath,
    appName: appEntry.name,
  };
}

/**
 * Create the macOS self-updater controller supporting unsigned/ad-hoc and signed builds.
 */
function createMacUpdater({
  app,
  owner,
  repo,
  getGitHubHeaders,
  getOptionalGitHubToken,
  getReleaseAsset,
  onStatus,
  onReadyToInstall,
}) {
  const userDataDir = app.getPath('userData');
  const stagingDir = path.join(userDataDir, 'pending-mac-update');
  const extractDir = path.join(stagingDir, 'extracted');
  const metaPath = path.join(stagingDir, 'metadata.json');
  const scriptPath = path.join(stagingDir, 'apply-update.sh');
  const logFile = path.join(userDataDir, 'mac-updater.log');

  let activeDownloadPromise = null;
  let activeDownloadVersion = null;
  let stagedUpdate = null;

  function emit(payload) {
    if (typeof onStatus === 'function') {
      onStatus(payload);
    }
  }

  function hydrateOrCleanStaged(meta) {
    if (!meta || !meta.version || !meta.appPath || !meta.appName) {
      return null;
    }
    const currentVersion = app.getVersion();
    if (compareVersions(meta.version, currentVersion) <= 0) {
      return null;
    }
    const infoPlistPath = path.join(meta.appPath, 'Contents', 'Info.plist');
    if (!fs.existsSync(infoPlistPath)) {
      return null;
    }
    const resolvedTarget = resolveTargetAppPath({
      execPath: process.execPath,
      extractedAppName: meta.appName,
    });
    const needsElevation = !checkTargetWritable(resolvedTarget.targetAppPath);
    return {
      ...meta,
      targetAppPath: resolvedTarget.targetAppPath,
      needsElevation,
      relocatedFromReadOnly: resolvedTarget.relocatedFromReadOnly,
    };
  }

  function cleanupStaleCache() {
    try {
      if (!fs.existsSync(metaPath)) {
        if (fs.existsSync(stagingDir)) {
          fs.rmSync(stagingDir, { recursive: true, force: true });
        }
        stagedUpdate = null;
        return;
      }
      const raw = fs.readFileSync(metaPath, 'utf8');
      const meta = JSON.parse(raw);
      const valid = hydrateOrCleanStaged(meta);
      if (!valid) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
        stagedUpdate = null;
      } else {
        stagedUpdate = valid;
      }
    } catch {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      stagedUpdate = null;
    }
  }

  function isDownloading() {
    return activeDownloadPromise !== null;
  }

  function getCurrentDownloadVersion() {
    return activeDownloadVersion;
  }

  function hasStagedUpdate() {
    if (!stagedUpdate) {
      return false;
    }
    const infoPlistPath = path.join(stagedUpdate.appPath, 'Contents', 'Info.plist');
    if (!fs.existsSync(infoPlistPath)) {
      stagedUpdate = null;
      return false;
    }
    return true;
  }

  function getStagedUpdate() {
    return hasStagedUpdate() ? stagedUpdate : null;
  }

  function stagedUpdateNeedsElevation() {
    if (!hasStagedUpdate()) {
      return false;
    }
    const resolvedTarget = resolveTargetAppPath({
      execPath: process.execPath,
      extractedAppName: stagedUpdate.appName,
    });
    stagedUpdate.targetAppPath = resolvedTarget.targetAppPath;
    stagedUpdate.needsElevation = !checkTargetWritable(resolvedTarget.targetAppPath);
    return stagedUpdate.needsElevation;
  }

  async function resolveZipDownloadTarget(updateInfo, isArm64) {
    const version = updateInfo?.version ? String(updateInfo.version).replace(/^v/, '') : null;
    const archLabel = isArm64 ? 'arm64' : 'x64';
    const selectedFile = selectMacFile(updateInfo?.files, { isArm64, extension: 'zip' });
    const token = typeof getOptionalGitHubToken === 'function' ? getOptionalGitHubToken() : null;

    if (token) {
      const { asset, version: releaseVer } = await getReleaseAsset(version, archLabel, '.zip');
      if (asset) {
        return {
          url: asset.url,
          fileName: asset.name,
          expectedSize: asset.size || selectedFile?.size || 0,
          expectedSha512: selectedFile?.sha512 || null,
          version: releaseVer || version,
        };
      }
    }

    if (selectedFile) {
      const normalizedUrl = selectedFile.url.startsWith('http')
        ? selectedFile.url
        : buildPublicReleaseDownloadUrl({
            owner,
            repo,
            tag: updateInfo?.tag,
            version,
            fileName: path.posix.basename(selectedFile.url),
          });
      return {
        url: normalizedUrl,
        fileName: path.posix.basename(selectedFile.url).replace(/ /g, '-'),
        expectedSize: selectedFile.size || 0,
        expectedSha512: selectedFile.sha512 || null,
        version,
      };
    }

    const { asset, version: releaseVer } = await getReleaseAsset(version, archLabel, '.zip');
    if (!asset) {
      throw new Error(`No macOS ZIP update package found for version ${version || 'latest'} (${archLabel})`);
    }
    return {
      url: token ? asset.url : asset.browser_download_url || asset.url,
      fileName: asset.name,
      expectedSize: asset.size || 0,
      expectedSha512: null,
      version: releaseVer || version,
    };
  }

  function downloadAndStageUpdate(updateInfo) {
    const requestedVersion = updateInfo?.version ? String(updateInfo.version).replace(/^v/, '') : null;

    if (activeDownloadPromise) {
      if (!requestedVersion || !activeDownloadVersion || activeDownloadVersion === requestedVersion) {
        return activeDownloadPromise;
      }
    }

    if (requestedVersion && hasStagedUpdate() && stagedUpdate.version === requestedVersion) {
      const payload = {
        status: 'downloaded',
        version: stagedUpdate.version,
        isMac: true,
        canAutoInstall: true,
        needsElevation: stagedUpdateNeedsElevation(),
        releaseNotes: updateInfo?.releaseNotes ?? stagedUpdate.releaseNotes,
      };
      emit(payload);
      if (typeof onReadyToInstall === 'function') {
        onReadyToInstall(stagedUpdate);
      }
      return Promise.resolve(stagedUpdate);
    }

    activeDownloadVersion = requestedVersion;
    activeDownloadPromise = (async () => {
      try {
        const isArm64 = detectIsArm64Mac({
          arch: process.arch,
          runningUnderARM64Translation: app.runningUnderARM64Translation,
        });

        const target = await resolveZipDownloadTarget(updateInfo, isArm64);
        const version = target.version || requestedVersion;
        activeDownloadVersion = version;

        await fs.promises.mkdir(stagingDir, { recursive: true });
        const zipDestPath = path.join(stagingDir, target.fileName || `update-${version || 'latest'}.zip`);

        emit({
          status: 'downloading',
          version,
          percent: 0,
          transferred: 0,
          total: target.expectedSize || 0,
          isMac: true,
          message: 'Downloading macOS update...',
        });

        await downloadFileWithSha512({
          url: target.url,
          headers: getGitHubHeaders('application/octet-stream'),
          destPath: zipDestPath,
          expectedSha512: target.expectedSha512,
          expectedSize: target.expectedSize,
          onProgress: (progress) => {
            emit({
              status: 'downloading',
              version,
              percent: progress.percent,
              transferred: progress.transferred,
              total: progress.total,
              bytesPerSecond: progress.bytesPerSecond,
              isMac: true,
              message: 'Downloading macOS update...',
            });
          },
        });

        emit({
          status: 'downloading',
          version,
          percent: 100,
          transferred: target.expectedSize || 0,
          total: target.expectedSize || 0,
          isMac: true,
          message: 'Verifying & preparing update...',
        });

        const { appPath, appName } = await extractMacZip(zipDestPath, extractDir);
        await fs.promises.rm(zipDestPath, { force: true }).catch(() => {});

        const resolvedTarget = resolveTargetAppPath({
          execPath: process.execPath,
          extractedAppName: appName,
        });
        const needsElevation = !checkTargetWritable(resolvedTarget.targetAppPath);

        const nextStaged = {
          version,
          appPath,
          appName,
          targetAppPath: resolvedTarget.targetAppPath,
          needsElevation,
          relocatedFromReadOnly: resolvedTarget.relocatedFromReadOnly,
          releaseNotes: updateInfo?.releaseNotes,
          preparedAt: new Date().toISOString(),
        };

        await fs.promises.writeFile(metaPath, JSON.stringify(nextStaged, null, 2), 'utf8');
        stagedUpdate = nextStaged;

        emit({
          status: 'downloaded',
          version,
          isMac: true,
          canAutoInstall: true,
          needsElevation,
          releaseNotes: updateInfo?.releaseNotes,
        });

        if (typeof onReadyToInstall === 'function') {
          onReadyToInstall(nextStaged);
        }

        return nextStaged;
      } catch (err) {
        const msg = err?.message || String(err);
        console.error('[MacUpdater] Failed to download/prepare update:', msg);
        emit({
          status: 'error',
          isMac: true,
          version: activeDownloadVersion || undefined,
          message: `Failed to download/prepare macOS update: ${msg}`,
        });
        throw err;
      } finally {
        activeDownloadPromise = null;
        activeDownloadVersion = null;
      }
    })();

    return activeDownloadPromise;
  }

  function installStagedUpdate({ relaunch = true, allowElevation = true } = {}) {
    if (!hasStagedUpdate()) {
      throw new Error('No staged macOS update is available to install');
    }

    const resolvedTarget = resolveTargetAppPath({
      execPath: process.execPath,
      extractedAppName: stagedUpdate.appName,
    });
    const targetAppPath = resolvedTarget.targetAppPath;
    const needsElevation = !checkTargetWritable(targetAppPath);
    stagedUpdate.targetAppPath = targetAppPath;
    stagedUpdate.needsElevation = needsElevation;

    fs.mkdirSync(stagingDir, { recursive: true });
    fs.writeFileSync(scriptPath, buildInstallScriptContent(), { encoding: 'utf8', mode: 0o700 });
    fs.chmodSync(scriptPath, 0o700);

    let runUser;
    try {
      runUser = os.userInfo().username || '';
    } catch {
      runUser = process.env.USER || '';
    }

    const scriptArgs = [
      scriptPath,
      String(process.pid),
      stagedUpdate.appPath,
      targetAppPath,
      relaunch ? '1' : '0',
      stagingDir,
      logFile,
      runUser,
    ];

    if (!needsElevation) {
      const child = spawn('/bin/sh', scriptArgs, {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return { status: 'installing', elevated: false };
    }

    if (!allowElevation) {
      return { status: 'skipped-elevation-required' };
    }

    const shellCmd = `nohup /bin/sh ${scriptArgs.map(shellQuote).join(' ')} >/dev/null 2>&1 &`;
    const appleScript = `do shell script "${escapeAppleScriptString(shellCmd)}" with administrator privileges`;

    return runExecFile(execFile, '/usr/bin/osascript', ['-e', appleScript])
      .then(() => ({ status: 'installing', elevated: true }))
      .catch((err) => {
        const msg = err?.message || '';
        if (msg.includes('User canceled') || msg.includes('(-128)') || err.code === 1) {
          return { status: 'cancelled' };
        }
        throw err;
      });
  }

  return {
    cleanupStaleCache,
    isDownloading,
    getCurrentDownloadVersion,
    hasStagedUpdate,
    getStagedUpdate,
    stagedUpdateNeedsElevation,
    downloadAndStageUpdate,
    installStagedUpdate,
  };
}

module.exports = {
  detectIsArm64Mac,
  selectMacFile,
  buildPublicReleaseDownloadUrl,
  compareVersions,
  resolveTargetAppPath,
  checkTargetWritable,
  shellQuote,
  escapeAppleScriptString,
  buildInstallScriptContent,
  downloadFileWithSha512,
  extractMacZip,
  createMacUpdater,
};
