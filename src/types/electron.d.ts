export interface UpdaterStatus {
  status:
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'installing'
    | 'mac-manual-update'
    | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string | Array<{ version: string; note: string | null }>;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  message?: string;
  isMac?: boolean;
  canAutoInstall?: boolean;
  needsElevation?: boolean;
  filePath?: string;
}

export interface ElectronAPI {
  platform: string;
  isMac: boolean;
  getVersion: () => Promise<string>;
  getUpdaterStatus?: () => Promise<UpdaterStatus | null>;
  checkForUpdates: () => Promise<{ status: string; message?: string; version?: string }>;
  quitAndInstall: () => Promise<{ status?: string; message?: string } | void>;
  openMacDownload: (version?: string) => Promise<{ status?: string; message?: string } | void>;
  startMacDownload?: (version?: string) => Promise<{ status: string; filePath?: string; version?: string }>;
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
