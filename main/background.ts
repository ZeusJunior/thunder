import path from 'path';
import fs from 'fs';
import { app, ipcMain, shell } from 'electron';
import serve from 'electron-serve';
import Store from 'electron-store';
import { createWindow } from './helpers';
import { LimitedAccount, ThunderConfig } from './types';
import SteamCommunity from 'steamcommunity';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

;(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});
ipcMain.on('open-new-window', async (event, { url, external }: { url: string; external: boolean }) => {
  if (external) {
    await shell.openExternal(url);
    return;
  }

  const newWindow = createWindow('external', {
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  await newWindow.loadURL(url);
});

// Password authentication IPC handlers
let store: Store<ThunderConfig> | null = null;

ipcMain.handle('check-config-exists', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    return fs.existsSync(configPath);
  } catch (error) {
    console.error('Error checking config existence:', error);
    return false;
  }
});

ipcMain.handle('create-encrypted-config', async (event, password: string) => {
  try {
    store = new Store({
      name: 'config',
      encryptionKey: password
    });
    
    store.set('initialized', true);
    store.set('createdAt', new Date().toISOString());
    
    return { success: true };
  } catch (error) {
    console.error('Error creating encrypted config:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('verify-password', async (event, password: string) => {
  try {
    store = new Store({
      name: 'config',
      encryptionKey: password
    });
    
    const initialized = store.get('initialized');
    
    if (initialized === true) {
      return { success: true };
    }

    return { success: false, error: 'Invalid password or corrupted config' };
  } catch (error) {
    console.error('Error verifying password:', error);
    return { success: false, error: 'Invalid password' };
  }
});

ipcMain.handle('debug-info', async () => {
  return {
    userDataPath: app.getPath('userData'),
    isProd,
    store: store?.store
  };
});

// Account management IPC handlers
ipcMain.handle('get-accounts', async () => {
  try {
    if (!store) {
      return { success: false, error: 'Not authenticated', accounts: {} };
    }
    
	 // todo: delete
    store.set('accounts', {
      '123': {
        id: '123',
        id64: '76561198000000000',
        username: 'example_user',
        sharedSecret: 'EXAMPLESHAREDSECRET==',
        identitySecret: 'EXAMPLEIDENTITYSECRET==',
        avatarUrl: 'https://avatars.fastly.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        meta: {
          createdAt: new Date().toISOString()
        }
      },
      '234': {
        id: '234',
		    id64: '76561198000000000',
        username: 'example_user2',
        sharedSecret: 'EXAMPLESHAREDSECRET==',
        identitySecret: 'EXAMPLEIDENTITYSECRET==',
		    avatarUrl: 'https://avatars.fastly.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        meta: {
          createdAt: new Date().toISOString()
        }
      }
	 });
	 store.delete('currentAccountId');

    const accounts = store.get('accounts', {});

    // Return limited account info only
    const limitedAccounts: Record<string, LimitedAccount> = {};
    for (const [id, account] of Object.entries(accounts)) {
      limitedAccounts[id] = {
        id64: account.id64,
        username: account.username,
        avatarUrl: account.avatarUrl,
        meta: account.meta,
      };
    }

    return { success: true, accounts: limitedAccounts };
  } catch (error) {
    console.error('Error getting accounts:', error);
    return { success: false, error: error.message, accounts: [] };
  }
});

ipcMain.handle('get-current-account', async () => {
  try {
    if (!store) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const currentAccountId = store.get('currentAccountId');
    if (!currentAccountId) {
      return { success: true, account: null };
    }
    
    const accounts = store.get('accounts', {});
    const currentAccount = accounts[currentAccountId];
    const limitedAccount: LimitedAccount = {
      id64: currentAccount.id64,
      username: currentAccount.username,
      avatarUrl: currentAccount.avatarUrl,
      meta: currentAccount.meta
    };
    return { success: true, account: limitedAccount || null };
  } catch (error) {
    console.error('Error getting current account:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-current-account', async (event, accountId: string) => {
  try {
    if (!store) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const accounts = store.get('accounts', {});
    const account = accounts[accountId];

    if (!account) {
      return { success: false, error: 'Account not found' };
    }
    
    store.set('currentAccountId', accountId);
    return { success: true };
  } catch (error) {
    console.error('Error setting current account:', error);
    return { success: false, error: error.message };
  }
});

// Steam methods for adding accounts
ipcMain.handle('add-authenticator-login', async (
  event,
  {
    accountName,
    password,
    authCode,
  }: {
    accountName: string;
    password: string;
    authCode?: string;
  }) => {
  try {
    if (!store) {
      return { success: false, error: 'Not authenticated' };
    }

    const details = { accountName, password, authCode, disableMobile: false };
    const community = new SteamCommunity();

    const result = await new Promise((resolve) => {
      community.login(details, (err, _sessionID, cookies) => {
        if (err) {
          if (err.message === 'SteamGuard') {
            return resolve({ success: false, error: `Please input the Steam Guard code sent to your email ending with ${err.emaildomain}`, codeRequired: true });
          }
          if (err.message === 'InvalidPassword') {
            return resolve({ success: false, error: 'Your password is invalid, please double check your login information.' });
          }
          if (err.message === 'SteamGuardMobile') {
            return resolve({ success: false, error: 'You already have an authenticator set up on this account.' });
          }

          return resolve({ success: false, error: err.message });
        }

        const accounts = store.get('accounts', {});
        const steamId = community.steamID.getSteamID64();
        console.log('Steam login successful for ', steamId);
        if (accounts[steamId]) {
          return resolve({ success: false, error: 'This account has already been added.' });
        }

        community.enableTwoFactor((err, response) => {
          if (err) {
            console.error('Error enabling 2FA:', err);
            return resolve({ success: false, error: err.message });
          }

          console.log('entire response', JSON.stringify(response, null, 2));

          accounts[steamId] = {
            id64: steamId,
            username: accountName,
            sharedSecret: response.shared_secret,
            identitySecret: response.identity_secret,
            recoveryCode: response.revocation_code,
            avatarUrl: 'https://avatars.fastly.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
            meta: {
              setupComplete: false,
              createdAt: new Date().toISOString(),
            },
            cookies,
          };

          store.set('accounts', accounts);
          return resolve({ success: true, steamId, recoveryCode: response.revocation_code });
        });
      });
    });

    return result;
  } catch (error) {
    console.error('Error adding account:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-authenticator-finalize', async (
  event,
  { steamId, activationCode }: { steamId: string, activationCode: string }
) => {
  try {
    if (!store) {
      return { success: false, error: 'Not authenticated' };
    }

    const accounts = store.get('accounts', {});
    const account = accounts[steamId];

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const community = new SteamCommunity();
    community.setCookies(account.cookies);

    // Finalize the 2FA setup
    const result = await new Promise((resolve) => {
      community.finalizeTwoFactor(account.sharedSecret, activationCode, (err) => {
        if (err) {
          console.error('Error finalizing 2FA:', err);
          return resolve({ success: false, error: err.message });
        }

        console.log('2FA setup finalized successfully for ', steamId);
        
        store.set('accounts', {
          ...accounts,
          [steamId]: {
            ...account,
            meta: {
              ...account.meta,
              setupComplete: true,
            },
          },
        });

        return resolve({ success: true });
      });
    });

    return result;
  } catch (error) {
    console.error('Error finalizing authenticator addition:', error);
    return { success: false, error: error.message };
  }
});
