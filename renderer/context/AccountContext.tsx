import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LimitedAccount, ThunderConfig } from '../../main/types';

interface AccountContextType {
  currentAccount: LimitedAccount | null;
  setCurrentAccount: (accountId: string | null) => boolean;
  accounts: ThunderConfig['accounts'] | null;
  loadAccounts: () => void;
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

  const loadAccounts = () => {
    setIsLoading(true);
    const result = window.electron.getAllAccounts();
    setAccounts(result);

    const currentResult = window.electron.getCurrentAccount();
    if (currentResult) {
      const accountExists = result[currentResult.id64];
      if (accountExists) {
        setCurrentAccountState(currentResult);
      }
    }
    setIsLoading(false);
  };

  const setCurrentAccount = (accountId: string | null) => {
    if (!accountId) {
      setCurrentAccountState(null);
      return true;
    }

    loadAccounts();

    if (accountId && accounts && accounts[accountId]) {
      const result = window.electron.setCurrentAccount(accountId);
      if (result) {
        setCurrentAccountState(accounts[accountId]);
      }

      return true;
    }

    setCurrentAccountState(null);
    return false;
  };

  useEffect(() => {
    function getAuthCode() {
      const code = window.electron.getAuthCode();
      return code;
    };

    function startTimer() {
      if (!currentAccount?.meta.setupComplete) return;

      const currentDateSeconds = new Date().getSeconds();
      let interval: NodeJS.Timeout;

      if (currentDateSeconds % 30 == 0) {
        // Start the interval to update the auth code every 30 seconds
        interval = setInterval(() => {
          setAuthCode(getAuthCode());
        }, 30 * 1000);
      } else {
        // Set a timeout to align with the next 30-second mark, then start the interval
        interval = setTimeout(startTimer, (30 - currentDateSeconds % 30) * 1000);
      }

      setAuthCode(getAuthCode());
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
