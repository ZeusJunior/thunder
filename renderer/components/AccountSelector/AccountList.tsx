import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAccount } from '../../context/AccountContext';
import ReloadIcon from '../Icons/Reload';

export default function AccountList({ onSelect }: { onSelect: (accountId: string) => void }) {
  const { accounts, isLoading, loadAccounts } = useAccount();
  const [filteredAccounts, setFilteredAccounts] = useState(Object.values(accounts || {}));
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const results = Object.values(accounts).filter((account) => {
      if (!search) return true;
      const query = search.toLowerCase();
      return (
        account.personaName.toLowerCase().includes(query) ||
        account.accountName.toLowerCase().includes(query) ||
        account.id64.toLowerCase().includes(query)
      );
    });
    setFilteredAccounts(results);
  }, [search, accounts]);

  const refreshProfile = async (accountId: string) => {
    const result = await window.electron.refreshProfile(accountId);
    if (result) {
      return await loadAccounts();
    }

    setError('Failed to refresh profile');
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

  const showSearch = filteredAccounts.length >= 5;

  return (
    <div className="space-y-4">

      {showSearch && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Accounts List */}
      <div className="space-y-2">
        {filteredAccounts.length > 0 ? (
          filteredAccounts.map((account) => (
            <button
              key={account.id64}
              onClick={() => onSelect(account.id64)}
              className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {account.avatarUrl ? (
                    <Image
                      src={account.avatarUrl}
                      alt={`${account.personaName} avatar`}
                      width={40}
                      height={40}
                      className="rounded-full mr-4 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full mr-4 bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                      {account.personaName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {account.personaName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Account:</span> {account.accountName}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">SteamID:</span> {account.id64}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshProfile(account.id64);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                    title="Refresh profile"
                  >
                    <ReloadIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400">
                    Added {new Date(account.meta.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {search ? 'No accounts found matching your search.' : 'No accounts available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
