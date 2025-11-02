import Store from 'electron-store';
import { ThunderConfig } from './types';

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