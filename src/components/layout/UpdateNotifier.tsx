import React, { useEffect, useState } from 'react';
import {
  AlertCircleIcon,
  ArrowUpCircleIcon,
  CheckCircle2Icon,
  DownloadCloudIcon,
  LaptopIcon,
  Loader2Icon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react';
import type { UpdaterStatus } from '../../types/electron';

const ACTIONABLE_STATUSES = new Set<UpdaterStatus['status']>([
  'available',
  'downloading',
  'downloaded',
  'installing',
  'mac-manual-update',
  'error',
]);

export function UpdateNotifier() {
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    window.electron
      ?.getUpdaterStatus?.()
      .then((initialStatus) => {
        if (initialStatus && ACTIONABLE_STATUSES.has(initialStatus.status)) {
          setStatus(initialStatus);
          setDismissed(false);
        }
      })
      .catch(() => { });

    if (!window.electron?.onUpdaterStatus) return;

    const cleanup = window.electron.onUpdaterStatus((newStatus) => {
      setStatus(newStatus);
      if (newStatus.status !== 'installing') {
        setInstalling(false);
      }
      if (
        newStatus.status === 'downloaded' ||
        newStatus.status === 'available' ||
        newStatus.status === 'mac-manual-update' ||
        newStatus.status === 'installing' ||
        newStatus.status === 'error'
      ) {
        setDismissed(false); // Un-dismiss when an update arrives, installs, or errors
      }
    });

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  if (!status || dismissed) return null;

  // macOS manual DMG fallback (only shown if direct auto-update info could not be resolved)
  if (status.status === 'mac-manual-update') {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex w-96 flex-col gap-3 rounded-xl border border-blue-500/30 bg-surface p-4 shadow-2xl backdrop-blur-md ring-1 ring-blue-500/20">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <LaptopIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-ink">macOS Update Available</h4>
                {status.version && (
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                    v{status.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                {status.message || 'A new version is ready for macOS. Click below to download and install the update.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-muted hover:bg-canvas hover:text-ink"
            title="Dismiss"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/50">
          <button
            type="button"
            onClick={() => {
              window.electron?.openMacDownload?.(status.version).catch(() => { });
            }}
            className="text-[11px] text-blue-600 hover:underline"
            title="Download DMG via default web browser"
          >
            Browser download
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas hover:text-ink transition-colors"
            >
              Later
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.electron?.startMacDownload) {
                  window.electron.startMacDownload(status.version).catch(() => { });
                } else {
                  window.electron?.openMacDownload?.(status.version).catch(() => { });
                }
              }}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <DownloadCloudIcon className="h-3.5 w-3.5" />
              Download & Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Downloading status notification
  if (status.status === 'downloading') {
    const percent = status.percent ?? 0;
    const mbTransferred = status.transferred ? Math.round(status.transferred / 1024 / 1024) : null;
    const mbTotal = status.total ? Math.round(status.total / 1024 / 1024) : null;

    return (
      <div className="fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2 rounded-xl border border-line bg-surface p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-ink">
            <DownloadCloudIcon className="h-4 w-4 animate-bounce text-accent" />
            <span className="text-xs font-semibold">Downloading Update</span>
          </div>
          <span className="text-xs font-medium text-muted">
            {percent}%{mbTotal ? ` (${mbTransferred || 0}/${mbTotal}MB)` : ''}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[11px] text-muted">
          {status.message || 'Downloading new version in the background'}
        </p>
      </div>
    );
  }

  // Installing status notification
  if (status.status === 'installing') {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex w-84 items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <RefreshCwIcon className="h-5 w-5 animate-spin text-accent" />
          <div>
            <p className="text-xs font-semibold text-ink">
              Installing Update {status.version ? `(v${status.version})` : ''}
            </p>
            <p className="text-[11px] text-muted">
              {status.message || 'Applying update and restarting Avenor System...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Downloaded status notification - Ready to Install!
  if (status.status === 'downloaded') {
    const isMac = Boolean(window.electron?.isMac || status.isMac);
    const canAutoInstall = !isMac || status.canAutoInstall !== false;

    const handleInstallClick = async () => {
      if (!window.electron?.quitAndInstall || installing) return;
      setInstalling(true);
      try {
        const res = await window.electron.quitAndInstall();
        if (res && res.status === 'cancelled') {
          setInstalling(false);
        } else if (res && res.status === 'error') {
          setInstalling(false);
          setStatus({
            status: 'error',
            isMac,
            version: status.version,
            message: res.message || 'Failed to apply update.',
          });
        }
      } catch {
        setInstalling(false);
      }
    };

    return (
      <div className="fixed bottom-5 right-5 z-50 flex w-96 flex-col gap-3 rounded-xl border border-emerald-500/20 bg-surface p-4 shadow-2xl backdrop-blur-md ring-1 ring-emerald-500/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-ink">
                  {canAutoInstall ? 'Update Ready' : 'macOS Update Ready'}
                </h4>
                {status.version && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                    v{status.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                {!canAutoInstall
                  ? 'DMG installer has been downloaded. Click below to open and drag into Applications.'
                  : isMac && status.needsElevation
                    ? 'Restart to apply the update and relaunch automatically. macOS may prompt for your administrator password.'
                    : 'Restart to apply updates, or it will automatically apply when you close the app.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-muted hover:bg-canvas hover:text-ink"
            title="Dismiss"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/50">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            disabled={installing}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas hover:text-ink transition-colors disabled:opacity-50"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installing}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            <RefreshCwIcon className={`h-3.5 w-3.5 ${installing ? 'animate-spin' : ''}`} />
            {installing
              ? 'Restarting...'
              : canAutoInstall
                ? 'Restart & Update Now'
                : 'Open DMG Installer'}
          </button>
        </div>
      </div>
    );
  }

  // Error status notification with Retry & macOS DMG fallback
  if (status.status === 'error') {
    const isMac = Boolean(window.electron?.isMac || status.isMac);
    return (
      <div className="fixed bottom-5 right-5 z-50 flex w-96 flex-col gap-3 rounded-xl border border-red-500/25 bg-surface p-4 shadow-2xl backdrop-blur-md ring-1 ring-red-500/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
              <AlertCircleIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink">Update Error</h4>
              <p className="text-xs text-muted break-words">
                {status.message || 'Unable to check or install update.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-muted hover:bg-canvas hover:text-ink"
            title="Dismiss"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/50">
          {isMac && (
            <button
              type="button"
              onClick={() => {
                window.electron?.openMacDownload?.(status.version).catch(() => { });
              }}
              className="mr-auto text-[11px] font-medium text-blue-600 hover:underline"
            >
              Download DMG
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-canvas hover:text-ink transition-colors"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => {
              window.electron?.checkForUpdates?.().catch(() => { });
            }}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Update available (prior to download start or info)
  if (status.status === 'available') {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex w-84 items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <ArrowUpCircleIcon className="h-5 w-5 text-accent" />
          <div>
            <p className="text-xs font-semibold text-ink">
              New Update Available {status.version ? `(v${status.version})` : ''}
            </p>
            <p className="text-[11px] text-muted">Starting background download...</p>
          </div>
        </div>
        <Loader2Icon className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  return null;
}