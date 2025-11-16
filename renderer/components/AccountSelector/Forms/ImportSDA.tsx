import { useState } from 'react';
import { ErrorMessage } from '../../ErrorMessage';
import SecondaryButton from '../../Form/SecondaryButton';
import PrimaryButton from '../../Form/PrimaryButton';

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

      {error && (<ErrorMessage message={error} />)}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="maFile" className="block text-sm font-medium text-gray-700">
            Select maFile
          </label>
          <div className="mt-1 flex items-center space-x-3">
            <SecondaryButton
              onClick={handleSelectFile}
              text={selectedFile ? selectedFile.split(/[\\/]/).pop() as string : 'Browse files'}
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <PrimaryButton
            type="submit"
            disabled={!selectedFile || isLoading}
            isLoading={isLoading}
            text='Import from SDA'
            loadingText='Importing...'
          />
          <SecondaryButton
            onClick={onCancel}
            text='Cancel'
          />
        </div>
      </form>
    </>
  );
}
