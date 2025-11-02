import path from 'path';
import { app, ipcMain, shell } from 'electron';
import serve from 'electron-serve';
import { createWindow, getCurrentAccount } from './helpers';
import SteamCommunity from 'steamcommunity';
import { loginAgain } from './helpers/steam';


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

// Password authentication IPC handlers

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
      proceed();
      return;
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
        proceed();
      })
      .catch(() => {
        event.reply('login-required');
      });

    return;
  });
});
