import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import PasswordAuth from '../components/PasswordAuth';
import AccountSelector from '../components/AccountSelector/AccountSelector';
import Layout from '../components/Layout';
import { AccountProvider } from '../context/AccountContext';

import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccountSelected, setHasAccountSelected] = useState(false);

  useEffect(() => {
    const configExists = window.electron.config.exists();
    setIsFirstTime(!configExists);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkCurrentAccount();
    }
  }, [isAuthenticated]);

  const checkCurrentAccount = () => {
    const result = window.electron.getCurrentAccount();
    if (result) {
      setHasAccountSelected(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <PasswordAuth
        isFirstTime={isFirstTime}
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <AccountProvider>
      {!hasAccountSelected
        ? <AccountSelector onAccountSelected={() => setHasAccountSelected(true)} />
        : (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
    </AccountProvider>
  );
}

export default MyApp;
