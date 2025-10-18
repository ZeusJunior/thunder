import path from 'path'
import fs from 'fs'
import { app, ipcMain } from 'electron'
import serve from 'electron-serve'
import Store from 'electron-store'
import { createWindow } from './helpers'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
  await app.whenReady()

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isProd) {
    await mainWindow.loadURL('app://./')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`)
})

// Password authentication IPC handlers
let store: Store | null = null

ipcMain.handle('check-config-exists', async () => {
  try {//
    const userDataPath = app.getPath('userData')
    const configPath = path.join(userDataPath, 'config.json')
    return fs.existsSync(configPath)
  } catch (error) {
    console.error('Error checking config existence:', error)
    return false
  }
})

ipcMain.handle('create-encrypted-config', async (event, password: string) => {
  try {
    store = new Store({
      name: 'config',
      encryptionKey: password
    })
    
    store.set('initialized', true)
    store.set('createdAt', new Date().toISOString())
    
    return { success: true }
  } catch (error) {
    console.error('Error creating encrypted config:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('verify-password', async (event, password: string) => {
  try {
    store = new Store({
      name: 'config',
      encryptionKey: password
    })
    
    const initialized = store.get('initialized')
    
    if (initialized === true) {
      return { success: true }
    }

    return { success: false, error: 'Invalid password or corrupted config' }
  } catch (error) {
    console.error('Error verifying password:', error)
    return { success: false, error: 'Invalid password' }
  }
})
