import Store from 'electron-store';
import { ThunderConfig } from './types';
import { copyFileSync, unlinkSync } from 'fs';

let store: Store<ThunderConfig> | null = null;

/**
 * Initialize the store with the provided password
 * @param password The encryption password
 * @returns Object indicating success or error
 */
export function initializeStore(password: string) {
  try {
    store = new Store({
      name: 'config',
      encryptionKey: password,
    });

    // Verify the store is accessible by trying to read from it
    const initialized = store.get('initialized');
    if (initialized === true) {
      return { success: true };
    }

    return { success: false, error: 'Invalid password or corrupted config' };
  } catch (error) {
    console.error('Error initializing store:', error);
    return { success: false, error: 'Invalid password' };
  }
}

/**
 * Create a new encrypted store with the provided password
 * @param password The encryption password
 * @returns Object indicating success or error
 */
export function createEncryptedStore(password: string) {
  try {
    store = new Store({
      name: 'config',
      encryptionKey: password,
    });

    store.set('initialized', true);
    store.set('createdAt', new Date().toISOString());

    return { success: true };
  } catch (error) {
    console.error('Error creating encrypted store:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get the shared store instance
 * @returns The store instance or null if not initialized
 */
export function getStore() {
  return store;
}

/**
 * Verify password is correct for the encrypted store
 * @param password The encryption password
 * @returns boolean indicating if the password is correct
 */
export function verifyPassword(password: string) {
  try {
    const tempStore = new Store({
      name: 'config',
      encryptionKey: password,
    });

    // Verify the store is accessible by trying to read from it
    const initialized = tempStore.get('initialized');
    if (!initialized) {
      // Corrupted config, or wrong password
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Change the password
 * @param currentPassword The current password
 * @param newPassword The new password
 * @param confirmPassword The repeated new password
 * @returns Object indicating success or error
 */
export function changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long' };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: 'New password must be different from current password' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New passwords do not match' };
    }

    if (!verifyPassword(currentPassword)) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Read all data with current password
    const currentStore = new Store<ThunderConfig>({
      name: 'config',
      encryptionKey: currentPassword,
    });

    const allData = currentStore.store;
    if (!allData) {
      return { success: false, error: 'Failed to read existing configuration' };
    }

    // Can't change encryption key of existing store, so delete and recreate. Make a backup first.
    const tempPath = currentStore.path + '.tmp';
    copyFileSync(currentStore.path, tempPath);
    unlinkSync(currentStore.path);

    // Create new store with new password
    const newStore = new Store<ThunderConfig>({
      name: 'config',
      encryptionKey: newPassword,
    });
    newStore.store = allData;

    // Verify new store works
    const initialized = newStore.get('initialized');
    if (initialized !== true) {
      // Restore from backup
      copyFileSync(tempPath, currentStore.path);
      unlinkSync(tempPath);
      return { success: false, error: 'Failed to verify new password. Password not changed.' };
    }

    store = newStore;
    // Success, delete backup
    unlinkSync(tempPath);

    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
