import Image from 'next/image';
import { useAccount } from '../../context/AccountContext';

export default function AccountList({ onSelect }: { onSelect: (accountId: string) => void }) {
  const { accounts, isLoading } = useAccount();

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
    <div className="space-y-2">
      {Object.entries(accounts).map(([id, account]) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {account.avatarUrl ? (
                <Image
                  src={account.avatarUrl}
                  alt={`${account.username} avatar`}
                  width={40}
                  height={40}
                  className="rounded-full mr-4 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full mr-4 bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                  {account.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {account.username}
                </h3>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">ID:</span> {account.id64}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                Added {new Date(account.meta.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
