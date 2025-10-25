import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, LimitedAccount, ThunderConfig } from '../../main/types';

interface AccountContextType {
  currentAccount: Account | null;
  setCurrentAccount: (accountId: string | null) => Promise<boolean>;
  accounts: ThunderConfig['accounts'] | null;
  loadAccounts: () => Promise<void>;
  isLoading: boolean;
  authCode: string;
  seconds: number;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccountState] = useState<LimitedAccount | null>(null);
  const [accounts, setAccounts] = useState<ThunderConfig['accounts'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authCode, setAuthCode] = useState<string>('');
  const [seconds, setSeconds] = useState<number>(0);

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

      await loadAccounts();

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
    async function getAuthCode() {
      const code = await window.ipc.invoke('get-auth-code');
      return code;
    };

    function startTimer() {
      if (!currentAccount?.meta.setupComplete) return;

      const currentDateSeconds = new Date().getSeconds();
      let interval: NodeJS.Timeout;

      if (currentDateSeconds % 30 == 0) {
        // Start the interval to update the auth code every 30 seconds
        interval = setInterval(() => {
          getAuthCode().then(code => setAuthCode(code));
        }, 30 * 1000);
      } else {
        // Set a timeout to align with the next 30-second mark, then start the interval
        interval = setTimeout(startTimer, (30 - currentDateSeconds % 30) * 1000);
      }

      getAuthCode().then(code => setAuthCode(code));
      return interval;
    }

    const authInterval = startTimer();
    const secondInterval = setInterval(() => setSeconds(new Date().getSeconds() % 30), 1000);

    return () => {
      clearInterval(authInterval);
      clearInterval(secondInterval);
    };
  }, [currentAccount]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const value: AccountContextType = {
    currentAccount,
    setCurrentAccount,
    accounts,
    loadAccounts,
    isLoading,
    authCode,
    seconds,
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
