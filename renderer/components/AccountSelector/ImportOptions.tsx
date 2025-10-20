import CloudDownloadIcon from '../Icons/CloudDownload';
import PlusIcon from '../Icons/Plus';

interface ImportOptionsProps {
  onSelect: (mode: 'new' | 'sda' | 'secrets' | null) => void;
  isFirstAccount: boolean;
}

export default function ImportOptions({ onSelect, isFirstAccount }: ImportOptionsProps) {
  if (isFirstAccount) {
    return (
      <div className="text-center">
        <div className="space-y-3">
          <button
            onClick={() => {
              onSelect('new');
            }}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Authenticator
          </button>
                          
          <button
            onClick={() => {
              onSelect('sda');
            }}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CloudDownloadIcon className="w-5 h-5 mr-2" />
              Import from SDA maFile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">Add another account:</p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              onSelect('new');
            }}
            className="flex-1 px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            New Authenticator
          </button>
          <button
            onClick={() => {
              onSelect('sda');
            }}
            className="flex-1 px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Import from SDA
          </button>
        </div>
      </div>
    </div>
  );
}
