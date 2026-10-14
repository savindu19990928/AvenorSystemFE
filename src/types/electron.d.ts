export interface UpdaterStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'mac-manual-update' | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string | Array<{ version: string; note: string | null }>;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  message?: string;
}

export interface ElectronAPI {
  platform: string;
  isMac: boolean;
  getVersion: () => Promise<string>;
  checkForUpdates: () => Promise<{ status: string; message?: string; version?: string }>;
  quitAndInstall: () => Promise<void>;
  openMacDownload: (version?: string) => Promise<void>;
  onUpdaterStatus: (callback: (status: UpdaterStatus) => void) => () => void;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
