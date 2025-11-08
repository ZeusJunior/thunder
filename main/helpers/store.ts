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

  const currentAccountId = store.get('currentAccountId');
  if (!currentAccountId) {
    return null;
  }

  return getAccount(currentAccountId, limited);
}

export function setCurrentAccount(accountId: string) {
  const store = getStore();
  if (!store) {
    // Crash
    throw new Error('Not authenticated');
  }

  const accounts = store.get('accounts', {});
  const account = accounts[accountId];

  if (!account) {
    // Crash, shouldn't be possible
    throw new Error('Account not found');
  }

  store.set('currentAccountId', accountId);
  return true;
}

export function getAccount(accountId: string): LimitedAccount | null;
export function getAccount(accountId: string, limited: boolean): LimitedAccount | Account | null
export function getAccount(accountId: string, limited: true): LimitedAccount | null;
export function getAccount(accountId: string, limited: false): Account | null;
export function getAccount(accountId: string, limited: boolean = true) {
  const store = getStore();
  if (!store) {
    // Crash
    throw new Error('Not authenticated');
  }

  const accounts = store.get('accounts', {});
  const account = accounts[accountId];
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
 * @param accountId The account ID to check
 * @return Boolean indicating if the account exists
 */
export function accountExists(accountId: string) {
  const store = getStore();
  if (!store) {
    return false;
  }

  const accounts = store.get('accounts', {});
  return accountId in accounts;
}

export function addAccount(accountId: string, accountData: Account) {
  const store = getStore();
  if (!store) {
    return false;
  }

  const accounts = store.get('accounts', {});
  if (accountId in accounts) {
    // Account already exists
    return false;
  }

  accounts[accountId] = accountData;
  store.set('accounts', accounts);
  return true;
}

type AccountUpdateData = {
  [K in keyof Account]?: Account[K];
};

/**
 * Update account data in the store
 * @param accountId The account ID to update
 * @param data Partial account data to update, nested objects will be fully replaced
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
export function updateAccount(accountId: string, data: AccountUpdateData): boolean {
  const store = getStore();
  if (!store) {
    return false;
  }

  const exists = accountExists(accountId);
  if (!exists) {
    return false;
  }

  Object.entries(data).forEach(([key, value]) => {
    store.set(`accounts.${accountId}.${key}`, value);
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
