import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, ThunderConfig } from '../../main/types';

interface AccountContextType {
  currentAccount: Account | null;
  setCurrentAccount: (accountId: string | null) => Promise<boolean>;
  accounts: ThunderConfig['accounts'] | null;
  loadAccounts: () => Promise<void>;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccountState] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<ThunderConfig['accounts'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const result = await window.ipc.invoke('get-accounts');
      if (result.success) {
        setAccounts(result.accounts);

        const currentResult = await window.ipc.invoke('get-current-account');
        if (currentResult.success && currentResult.account) {
          const accountExists = result.accounts[currentResult.account.id64];
          if (accountExists) {
            setCurrentAccountState(currentResult.account);
          }
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentAccount = async (accountId: string | null) => {
    try {
      if (!accountId) {
        setCurrentAccountState(null);
        return true;
      }
      if (accountId && accounts && accounts[accountId]) {
        const result = await window.ipc.invoke('set-current-account', accountId);
        if (result.success) {
          setCurrentAccountState(accounts[accountId]);
        }

        return true;
      }

      setCurrentAccountState(null);
      return false;
    } catch (error) {
      console.error('Error setting current account:', error);
      return false;
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const value: AccountContextType = {
    currentAccount,
    setCurrentAccount,
    accounts,
    loadAccounts,
    isLoading,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
