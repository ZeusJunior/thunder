import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LimitedAccount } from '../../main/types';

interface AccountContextType {
  currentAccount: LimitedAccount | null;
  setCurrentAccount: (accountId: string | null) => Promise<boolean>;
  accounts: Record<string, LimitedAccount>;
  loadAccounts: () => Promise<Record<string, LimitedAccount>>;
  isLoading: boolean;
  authCode: string;
  seconds: number;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [currentAccount, setCurrentAccountState] = useState<LimitedAccount | null>(null);
  const [accounts, setAccounts] = useState<Record<string, LimitedAccount>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [authCode, setAuthCode] = useState<string>('');
  const [seconds, setSeconds] = useState<number>(0);

  const loadAccounts = async () => {
    setIsLoading(true);
    const result = await window.electron.getAllAccounts();
    setAccounts(result);

    const currentResult = await window.electron.getCurrentAccount();
    if (currentResult) {
      const accountExists = result[currentResult.id64];
      if (accountExists) {
        setCurrentAccountState(currentResult);
      }
    }

    setIsLoading(false);

    return result;
  };

  const setCurrentAccount = async (accountId: string | null) => {
    if (!accountId) {
      setCurrentAccountState(null);
      return true;
    }

    const freshAccounts = await loadAccounts();

    if (accountId && freshAccounts && freshAccounts[accountId]) {
      const result = await window.electron.setCurrentAccount(accountId);
      if (result) {
        setCurrentAccountState(freshAccounts[accountId]);
      }

      return true;
    }

    setCurrentAccountState(null);
    return false;
  };

  useEffect(() => {
    function startTimer() {
      if (!currentAccount?.meta.setupComplete) return;

      const currentDateSeconds = new Date().getSeconds();
      let interval: NodeJS.Timeout;

      if (currentDateSeconds % 30 == 0) {
        // Start the interval to update the auth code every 30 seconds
        interval = setInterval(() => {
          window.electron.getAuthCode().then(code => setAuthCode(code));
        }, 30 * 1000);
      } else {
        // Set a timeout to align with the next 30-second mark, then start the interval
        interval = setTimeout(startTimer, (30 - currentDateSeconds % 30) * 1000);
      }

      window.electron.getAuthCode().then(code => setAuthCode(code));
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
