import { useState } from 'react';

interface NewAuthenticatorProps {
  onSuccess: (accountId: string) => void;
  onCancel: () => void;
}

export default function ImportSDA({ onSuccess, onCancel }: NewAuthenticatorProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = async () => {
    try {
      const filePath = await window.electron.showMaFileDialog();
      if (filePath) {
        setSelectedFile(filePath);
        setError(null);
      }
    } catch {
      setError('Failed to open file picker');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a maFile first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const importResult = await window.electron.importMaFile(selectedFile);

      if (importResult) {
        onSuccess(importResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import maFile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Import from SDA maFile
        </h3>
        <p className="text-sm text-gray-600">
          Import an existing authenticator from a Steam Desktop Authenticator maFile.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="maFile" className="block text-sm font-medium text-gray-700">
            Select maFile
          </label>
          <div className="mt-1 flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSelectFile}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Browse Files
            </button>
            {selectedFile && (
              <span className="text-sm text-gray-600 truncate">
                {selectedFile.split(/[\\/]/).pop()}
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!selectedFile || isLoading}
            className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importing...' : 'Import from SDA'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
