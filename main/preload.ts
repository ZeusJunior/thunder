import { contextBridge, ipcRenderer } from 'electron';
import { configFileExists, getDebugInfo } from './helpers';
import { createEncryptedStore, initializeStore } from './store';
import { getAllAccounts, getCurrentAccount, setCurrentAccount } from './helpers/store';
import { addAuthenticator, finalizeAuthenticator, getAuthCode, loginAgain, refreshProfile } from './helpers/steam';
import SteamCommunity from 'steamcommunity';

const handler = {
  getDebugInfo: () => getDebugInfo(),
  config: {
    exists: () => configFileExists(),
    create: (password: string) => createEncryptedStore(password),
    initialize: (password: string) => initializeStore(password),
  },
  openWindow: (url: string, external: boolean) => {
    ipcRenderer.send('open-new-window', { url, external });
  },
  openSteamWindow: (url: string) => {
    ipcRenderer.send('open-steam-window', { url });
  },

  addAuthenticator: (
    options: Pick<SteamCommunity.LoginOptions, 'accountName' | 'password' | 'authCode'>
  ) => addAuthenticator(options),
  finalizeAuthenticator: (steamId: string, activationCode: string) => finalizeAuthenticator(steamId, activationCode),

  getAllAccounts: () => getAllAccounts(),
  getCurrentAccount: () => getCurrentAccount(),
  setCurrentAccount: (accountId: string) => setCurrentAccount(accountId),
  refreshProfile: (accountId: string) => {
    return refreshProfile(accountId).catch(() => false);
  },

  loginAgain: async (password: string) => {
    const account = getCurrentAccount(false);
    if (!account) {
      throw new Error('No current account set');
    }

    return loginAgain({
      accountName: account.accountName,
      password,
      twoFactorCode: getAuthCode(account.sharedSecret!),
    });
  },
  getAuthCode: () => {
    const account = getCurrentAccount(false);
    if (!account || !account.sharedSecret) {
      return '';
    }
    return getAuthCode(account.sharedSecret);
  },

  events: {
    onLoginRequired: (callback: () => void) => {
      ipcRenderer.on('login-required', () => {
        callback();
      });
    },
  }
};

contextBridge.exposeInMainWorld('electron', handler);

export type IpcHandler = typeof handler;
