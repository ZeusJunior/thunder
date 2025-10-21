import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { LimitedAccount } from './types';

interface ChannelReturnTypes {
  'check-config-exists': boolean;
  'create-encrypted-config': { success: boolean; error?: string };
  'verify-password': { success: boolean; error?: string };
  'debug-info': Record<string, unknown>;
  
  'get-accounts': { success: boolean; accounts: Record<string, LimitedAccount>; error?: string };
  'get-current-account': { success: boolean; account?: LimitedAccount; error?: string };
  'set-current-account': { success: boolean; error?: string };

  'add-authenticator-login': { success: boolean; error?: string, codeRequired?: boolean, steamId?: string, recoveryCode?: string };
  'add-authenticator-finalize': { success: boolean; error?: string, recoveryCode?: string };
}

type TypedHandler = {
  send(channel: string, value: unknown): void
  on(channel: string, callback: (...args: unknown[]) => void): () => void
  invoke<K extends keyof ChannelReturnTypes>(
    channel: K, 
    ...args: unknown[]
  ): Promise<ChannelReturnTypes[K]>
  invoke(channel: string, ...args: unknown[]): Promise<unknown>
}

const handler: TypedHandler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  invoke(channel: string, ...args: unknown[]) {
    return ipcRenderer.invoke(channel, ...args);
  },
};

contextBridge.exposeInMainWorld('ipc', handler);

export type IpcHandler = TypedHandler
