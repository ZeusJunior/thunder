import { contextBridge, ipcRenderer } from 'electron';
import SteamCommunity from 'steamcommunity';
import { IpcHandlers } from './types';

// Type-safe IPC invoke helper
function invoke<K extends keyof IpcHandlers>(
  channel: K,
  ...args: Parameters<IpcHandlers[K]>
): Promise<Awaited<ReturnType<IpcHandlers[K]>>> {
  return ipcRenderer.invoke(channel, ...args) as Promise<Awaited<ReturnType<IpcHandlers[K]>>>;
}

const handler = {
  getDebugInfo: () => invoke('debug-info'),
  config: {
    exists: () => invoke('config-exists'),
    create: (password: string) => invoke('config-create', password),
    initialize: (password: string) => invoke('config-initialize', password),
  },
  showAppDataDirectory: () => {
    ipcRenderer.send('show-app-data-directory');
  },
  openBrowser: {
    github: () => {
      ipcRenderer.send('open-browser-github');
    }
  },
  openSteamWindow: {
    community: () => {
      ipcRenderer.send('open-steam-community');
    },
    tradeOffers: () => {
      ipcRenderer.send('open-steam-tradeoffers');
    },
  },

  addAuthenticator: (
    options: Pick<SteamCommunity.LoginOptions, 'accountName' | 'password' | 'authCode'>
  ) => invoke('add-authenticator', options),
  finalizeAuthenticator: (steamId: string, activationCode: string) =>
    invoke('finalize-authenticator', steamId, activationCode),

  getAllAccounts: () => invoke('get-all-accounts'),
  getCurrentAccount: () => invoke('get-current-account'),
  setCurrentAccount: (accountId: string) => invoke('set-current-account', accountId),
  refreshProfile: (accountId: string) => {
    return invoke('refresh-profile', accountId);
  },

  loginAgain: async (password: string) => {
    return invoke('login-again', password);
  },
  getAuthCode: () => {
    return invoke('get-auth-code');
  },
  exportAccountSecrets: (password: string) => {
    return invoke('export-account-secrets', password);
  },

  showMaFileDialog: () => {
    return invoke('show-mafile-dialog');
  },
  importMaFile: (filePath: string) => {
    return invoke('import-mafile', filePath);
  },

  getConfirmations: () => {
    return invoke('get-confirmations');
  },
  respondToConfirmation: (id: number, key: string, accept: boolean) => {
    return invoke('respond-to-confirmation', id, key, accept);
  },
  acceptAllConfirmations: () => {
    return invoke('accept-all-confirmations');
  },

  events: {
    onLoginRequired: (callback: () => void) => {
      ipcRenderer.on('login-required', () => {
        callback();
      });
    },
    removeOnLoginRequired: () => {
      ipcRenderer.removeAllListeners('login-required');
    }
  }
};

contextBridge.exposeInMainWorld('electron', handler);

export type IpcHandler = typeof handler;
