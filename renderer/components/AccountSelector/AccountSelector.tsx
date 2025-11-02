import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useAccount } from '../../context/AccountContext';
import AccountList from './AccountList';
import NewAuthenticator from './Forms/NewAuthenticator';
import ImportSDA from './Forms/ImportSDA';
import ImportOptions from './ImportOptions';

interface AccountSelectorProps {
  onAccountSelected?: () => void;
}

export default function AccountSelector({ onAccountSelected = () => { } }: AccountSelectorProps) {
  const { accounts, isLoading, setCurrentAccount } = useAccount();
  const [isFirstAccount, setIsFirstAccount] = useState(true);
  const [addAccountMode, setAddAccountMode] = useState<'new' | 'sda' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accounts && Object.keys(accounts).length > 0) {
      setIsFirstAccount(false);
    }
  }, [accounts]);

  const handleSetAccountMode = (mode: 'new' | 'sda' | null) => {
    setAddAccountMode(mode);
    setError('');
  };

  const handleSelectAccount = useCallback((accountId: string) => {
    const result = setCurrentAccount(accountId);
    if (result) {
      onAccountSelected();
      return;
    }

    setError('Failed to select account');
  }, [onAccountSelected, setCurrentAccount]);

  const handleImportSDA = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // TODO: Implement SDA maFile parsing
      setError('SDA import is not yet implemented');
    } catch (error) {
      console.error('Error importing SDA file:', error);
      setError('Failed to import SDA file');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{isFirstAccount ? 'Add your first account - Thunder' : 'Select Account - Thunder'}</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              {isFirstAccount ? 'Add your first account' : 'Select an account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isFirstAccount
                ? 'Add your first account to Thunder!'
                : 'Choose an account to use with Thunder'}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {!addAccountMode ? (
            <div className="space-y-4">
              {!isFirstAccount && <AccountList onSelect={handleSelectAccount} />}

              <ImportOptions onSelect={handleSetAccountMode} isFirstAccount={isFirstAccount} />
            </div>
          ) : (
            <div className="space-y-4">
              {addAccountMode === 'new' && (
                <NewAuthenticator
                  onSuccess={handleSelectAccount}
                  onCancel={() => setAddAccountMode(null)}
                />
              )}

              {addAccountMode === 'sda' && (
                <ImportSDA onSubmit={handleImportSDA} onCancel={() => setAddAccountMode(null)} />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
