import path from 'path';
import { getStore } from '../store';
import { Account, LimitedAccount } from '../types';
import { app } from 'electron';
import { existsSync } from 'fs';

/**
 * Check if the config file exists, indicating prior setup
 * @returns Boolean
 */
export function configFileExists() {
  const userDataPath = app.getPath('userData');
  const configPath = path.join(userDataPath, 'config.json');
  return existsSync(configPath);
}

/**
 * Get the current account from the store
 * @param limited Whether to return limited account info only, for frontend use
 * @return The current Account or null if not set
 */
export function getCurrentAccount(): LimitedAccount | null;
export function getCurrentAccount(limited: true): LimitedAccount | null;
export function getCurrentAccount(limited: false): Account | null;
export function getCurrentAccount(limited: boolean = true) {
  const store = getStore();
  if (!store) {
    // Crash
    throw new Error('Not authenticated');
  }

  const currentSteamId = store.get('currentSteamId');
  if (!currentSteamId) {
    return null;
  }

  return getAccount(currentSteamId, limited);
}

export function setCurrentAccount(steamId: string) {
  const store = getStore();
  if (!store) {
    // Crash
    throw new Error('Not authenticated');
  }

  const accounts = store.get('accounts', {});
  const account = accounts[steamId];

  if (!account) {
    // Crash, shouldn't be possible
    throw new Error('Account not found');
  }

  store.set('currentSteamId', steamId);
  return true;
}

export function getAccount(steamId: string): LimitedAccount | null;
export function getAccount(steamId: string, limited: boolean): LimitedAccount | Account | null
export function getAccount(steamId: string, limited: true): LimitedAccount | null;
export function getAccount(steamId: string, limited: false): Account | null;
export function getAccount(steamId: string, limited: boolean = true) {
  const store = getStore();
  if (!store) {
    // Crash
    throw new Error('Not authenticated');
  }

  const accounts = store.get('accounts', {});
  const account = accounts[steamId];
  if (!account) {
    return null;
  }

  if (limited) {
    return {
      id64: account.id64,
      personaName: account.personaName,
      accountName: account.accountName,
      avatarUrl: account.avatarUrl,
      meta: account.meta,
    } as LimitedAccount;
  }

  return account;
}

/**
 * Get all accounts from the store
 * @return An object mapping account IDs to Account data
 */
export function getAllAccounts() {
  const store = getStore();
  if (!store) {
    // Crash
    throw new Error('Not authenticated');
  }

  const accounts = store.get('accounts', {});

  // Return limited account info only
  const limitedAccounts: Record<string, LimitedAccount> = {};
  for (const [id, account] of Object.entries(accounts)) {
    limitedAccounts[id] = {
      id64: account.id64,
      personaName: account.personaName,
      accountName: account.accountName,
      avatarUrl: account.avatarUrl,
      meta: account.meta,
    };
  }

  return limitedAccounts;
}

/**
 * Check if a specific account exists in the store
 * @param steamId The steam ID to check
 * @return Boolean indicating if the account exists
 */
export function accountExists(steamId: string) {
  const store = getStore();
  if (!store) {
    return false;
  }

  const accounts = store.get('accounts', {});
  return steamId in accounts;
}

export function addAccount(steamId: string, accountData: Account) {
  const store = getStore();
  if (!store) {
    return false;
  }

  const accounts = store.get('accounts', {});
  if (steamId in accounts) {
    // Account already exists
    return false;
  }

  accounts[steamId] = accountData;
  store.set('accounts', accounts);
  return true;
}

type AccountUpdateData = {
  [K in keyof Account]?: Account[K];
};

/**
 * Update account data in the store
 * @param steamId The steam ID to update
 * @param data Partial account data to update, nested objects will be fully replaced. null/undefined values will remove the property.
 * @return Boolean indicating if the update was successful
 * 
  * @example
 * // Valid - updates top-level properties
 * updateAccount('123', { personaName: 'NewName', avatarUrl: 'newurl' });
 *
 * // Valid - but replaces entire meta object
 * updateAccount('123', { meta: { setupComplete: true } });
 * // Better to merge manually:
 * const account = getAccount('123');
 * updateAccount('123', { meta: { ...account.meta, setupComplete: true } });
 *
 * // Not supported - nested property updates
 * // updateAccount('123', { 'meta.setupComplete': true });
 */
export function updateAccount(steamId: string, data: AccountUpdateData): boolean {
  const store = getStore();
  if (!store) {
    return false;
  }

  const exists = accountExists(steamId);
  if (!exists) {
    return false;
  }

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      // @ts-expect-error Type doesn't support dot notation
      store.delete(`accounts.${steamId}.${key}`);
    } else {
      store.set(`accounts.${steamId}.${key}`, value);
    }
  });

  return true;
}

export function getDebugInfo() {
  const isProd = app.isPackaged;
  if (isProd) {
    throw new Error('Debug info is only available in development mode');
  }

  const store = getStore();
  if (!store) {
    return null;
  }

  return {
    userDataPath: app.getPath('userData'),
    isProd,
    store: store.store,
  };
}
