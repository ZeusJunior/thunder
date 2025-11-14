import path from 'path';
import { app, ipcMain, shell, dialog } from 'electron';
import serve from 'electron-serve';
import { createWindow, getCurrentAccount, getDebugInfo, configFileExists, getAllAccounts, setCurrentAccount, addAccount, accountExists } from './helpers';
import SteamCommunity from 'steamcommunity';
import { addAuthenticator, finalizeAuthenticator, getAuthCode, loginAgain, refreshProfile } from './helpers/steam';
import { createEncryptedStore, initializeStore } from './store';
import { Account, Confirmation, IpcHandlers, MaFileData } from './types';
import { readFile } from 'fs/promises';
import { getConfirmationKey, time } from 'steam-totp';
import { autoUpdater } from 'electron-updater';
import { DownloadStatusPage } from './html/download-status';

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

  let updateWindow: Electron.BrowserWindow | null = null;

  const createUpdateWindow = () => {
    updateWindow = createWindow('update', {
      width: 400,
      height: 200,
      frame: false,
      resizable: false,
    });

    // Load a simple HTML page for the update progress
    updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(DownloadStatusPage)}`);

    return updateWindow;
  };

  autoUpdater.autoDownload = false;
  const result = await autoUpdater.checkForUpdates();

  // If there's an update available, show the update window and download
  if (result?.updateInfo && result.updateInfo.version !== app.getVersion()) {
    const choice = dialog.showMessageBoxSync({
      type: 'info',
      buttons: ['Download & Install', 'Skip'],
      defaultId: 0,
      title: 'Update available',
      message: `A new version (${app.getVersion()} -> ${result.updateInfo.version}) is available. Download now?`,
      detail: 'The app will start after the update is installed.'
    });

    if (choice === 0) {
      createUpdateWindow();

      // Set up progress tracking
      autoUpdater.on('download-progress', (progressObj) => {
        if (updateWindow && !updateWindow.isDestroyed()) {
          updateWindow.webContents.executeJavaScript(`
            document.getElementById('progressBar').style.width = '${progressObj.percent}%';
            document.getElementById('progressText').textContent = '${Math.round(progressObj.percent)}% (${Math.round(progressObj.bytesPerSecond / 1024 / 1024)} MB/s)';
          `);
        }
      });

      // Wait for download to complete
      await new Promise<void>((resolve) => {
        autoUpdater.once('update-downloaded', () => {
          if (updateWindow && !updateWindow.isDestroyed()) {
            updateWindow.close();
          }

          const installChoice = dialog.showMessageBoxSync({
            type: 'question',
            buttons: ['Install and Restart', 'Later'],
            defaultId: 0,
            title: 'Update ready',
            message: 'The update has been downloaded. Install and restart now?'
          });

          if (installChoice === 0) {
            autoUpdater.quitAndInstall();
          } else {
            resolve();
          }
        });

        autoUpdater.downloadUpdate();
      });
    }
  }

  // Create main window after update check/download
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

handleIpc('get-confirmations', async (event) => {
  const account = getCurrentAccount(false);
  if (!account) {
    throw new Error('No current account set');
  }

  const community = new SteamCommunity();
  community.setCookies(account.cookies || []);

  return new Promise((resolve, reject) => {
    community.loggedIn(async (err, loggedIn) => {
      if (err) {
        event.sender.send('login-required');
        return resolve([]);
      }

      const proceed = async () => {
        community.getConfirmations(time(), getConfirmationKey(account.identitySecret, time(), 'conf'), async (err, confirmations) => {
          if (err) {
            return reject(err);
          }

          return resolve(confirmations as unknown as Confirmation[]);
        });
      };

      if (loggedIn) {
        return proceed();
      }

      // If we're not logged in, check if we have a refresh token to re-authenticate
      if (!account?.refreshToken) {
        event.sender.send('login-required');
        return resolve([]);
      }

      loginAgain({
        refreshToken: account.refreshToken,
      })
        .then(() => {
          return proceed();
        })
        .catch(() => {
          event.sender.send('login-required');
          return resolve([]);
        });
    });
  });
});

handleIpc('respond-to-confirmation', async (event, id: number, key: string, accept: boolean) => {
  const account = getCurrentAccount(false);
  if (!account) {
    throw new Error('No current account set');
  }

  const community = new SteamCommunity();
  community.setCookies(account.cookies || []);

  return new Promise((resolve, reject) => {
    const confTime = time();
    const confKey = getConfirmationKey(account.identitySecret, confTime, accept ? 'allow' : 'cancel');
    community.respondToConfirmation(id, key, confTime, confKey, accept, (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
});

handleIpc('accept-all-confirmations', async () => {
  const account = getCurrentAccount(false);
  if (!account) {
    throw new Error('No current account set');
  }

  const community = new SteamCommunity();
  community.setCookies(account.cookies || []);

  return new Promise((resolve, reject) => {
    const confTime = time();
    const confKey = getConfirmationKey(account.identitySecret, confTime, 'conf');
    const allowKey = getConfirmationKey(account.identitySecret, confTime, 'allow');
    community.acceptAllConfirmations(confTime, confKey, allowKey, (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
});
