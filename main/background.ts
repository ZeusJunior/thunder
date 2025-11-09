import path from 'path';
import { app, ipcMain, shell, dialog } from 'electron';
import serve from 'electron-serve';
import { createWindow, getCurrentAccount, getDebugInfo, configFileExists, getAllAccounts, setCurrentAccount, addAccount, accountExists } from './helpers';
import SteamCommunity from 'steamcommunity';
import { addAuthenticator, finalizeAuthenticator, getAuthCode, loginAgain, refreshProfile } from './helpers/steam';
import { createEncryptedStore, initializeStore } from './store';
import { Account, IpcHandlers, MaFileData } from './types';
import { readFile } from 'fs/promises';

// Type-safe IPC handler helper
function handleIpc<K extends keyof IpcHandlers>(
  channel: K,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: Parameters<IpcHandlers[K]>) => ReturnType<IpcHandlers[K]>
) {
  ipcMain.handle(channel, handler);
}


if (app.isPackaged) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (app.isPackaged) {
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
ipcMain.on(
  'open-new-window',
  async (event, { url, external }: { url: string; external: boolean }) => {
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
  }
);

ipcMain.on('open-steam-window', async (event, { url }: { url: string }) => {
  const account = getCurrentAccount(false);
  if (!account) {
    throw new Error('No current account set');
  }

  const community = new SteamCommunity();
  community.setCookies(account.cookies || []);
  community.loggedIn(async (err, loggedIn) => {
    if (err) {
      event.reply('login-required');
      return;
    }

    const proceed = async () => {
      const steamWindow = createWindow('steam', {
        width: 1200,
        height: 800,
      });
      const cookies = account.cookies || [];
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        await steamWindow.webContents.session.cookies.set({
          url: 'https://steamcommunity.com',
          name,
          value,
        });
      }

      await steamWindow.loadURL(url);
    };

    if (loggedIn) {
      return proceed();
    }

    // If we're not logged in, check if we have a refresh token to re-authenticate
    if (!account?.refreshToken) {
      event.reply('login-required');
      return;
    }

    loginAgain({
      refreshToken: account.refreshToken,
    })
      .then(() => {
        return proceed();
      })
      .catch(() => {
        event.reply('login-required');
      });

    return;
  });
});

handleIpc('debug-info', async () => {
  return getDebugInfo();
});

// Config handlers
handleIpc('config-exists', async () => {
  return configFileExists();
});

handleIpc('config-create', async (event, password) => {
  return createEncryptedStore(password);
});

handleIpc('config-initialize', async (event, password) => {
  return initializeStore(password);
});

// Account handlers
handleIpc('get-all-accounts', async () => {
  return getAllAccounts();
});

handleIpc('get-current-account', async () => {
  return getCurrentAccount();
});

handleIpc('set-current-account', async (event, accountId) => {
  return setCurrentAccount(accountId);
});

handleIpc('refresh-profile', async (event, accountId) => {
  return await refreshProfile(accountId);
});

// Steam handlers
handleIpc('add-authenticator', async (event, options) => {
  return addAuthenticator(options);
});

handleIpc('finalize-authenticator', async (event, steamId, activationCode) => {
  return finalizeAuthenticator(steamId, activationCode);
});

handleIpc('login-again', async (event, password) => {
  const account = getCurrentAccount(false);
  if (!account) {
    throw new Error('No current account set');
  }

  return loginAgain({
    accountName: account.accountName,
    password,
    twoFactorCode: getAuthCode(account.sharedSecret!),
  });
});

handleIpc('get-auth-code', async () => {
  const account = getCurrentAccount(false);
  if (!account || !account.sharedSecret) {
    return '';
  }
  return getAuthCode(account.sharedSecret);
});

handleIpc('show-mafile-dialog', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select maFile',
    filters: [
      { name: 'maFile', extensions: ['maFile'] },
    ],
    properties: ['openFile']
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

handleIpc('import-mafile', async (event, filePath) => {
  const fileContent = await readFile(filePath, 'utf-8');
  // Quick check if file is json
  if (!fileContent.trim().startsWith('{')) {
    throw new Error('Invalid maFile format, is your maFile still encrypted?');
  }

  // Fix SteamID to be a string
  const maFileData: MaFileData = JSON.parse(fileContent.replace(/"SteamID":(\d+)/, '"SteamID":"$1"'));

  if (!maFileData.shared_secret || !maFileData.identity_secret || !maFileData.Session.SteamID) {
    throw new Error('Invalid maFile format');
  }

  const existingAccount = accountExists(maFileData.Session.SteamID);

  if (existingAccount) {
    throw new Error('An account with this SteamID has already been added to Thunder');
  }

  // Create account data
  const accountData: Account = {
    id64: maFileData.Session.SteamID,
    personaName: maFileData.account_name,
    accountName: maFileData.account_name,
    sharedSecret: maFileData.shared_secret,
    identitySecret: maFileData.identity_secret,
    recoveryCode: maFileData.revocation_code,
    avatarUrl: 'https://avatars.fastly.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    twoFactorResponse: {
      shared_secret: maFileData.shared_secret,
      serial_number: maFileData.serial_number,
      revocation_code: maFileData.revocation_code,
      uri: maFileData.uri,
      server_time: maFileData.server_time,
      account_name: maFileData.account_name,
      token_gid: maFileData.token_gid,
      identity_secret: maFileData.identity_secret,
      secret_1: maFileData.secret_1,
      status: maFileData.status,
      // maFiles do not have a confirm_type
    },
    meta: {
      setupComplete: true,
      createdAt: new Date().toISOString()
    }
  };

  // Add the account
  const success = addAccount(maFileData.Session.SteamID, accountData);

  if (!success) {
    throw new Error('Failed to add account');
  }

  return maFileData.Session.SteamID;
});