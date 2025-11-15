import PrimaryButton from '../Form/PrimaryButton';
import SecondaryButton from '../Form/SecondaryButton';
import CloudDownloadIcon from '../Icons/CloudDownload';
import PlusIcon from '../Icons/Plus';

interface ImportOptionsProps {
  onSelect: (mode: 'new' | 'sda' | null) => void;
  isFirstAccount: boolean;
}

export default function ImportOptions({ onSelect, isFirstAccount }: ImportOptionsProps) {
  if (isFirstAccount) {
    return (
      <div className="text-center">
        <div className="space-y-3">
          <PrimaryButton
            onClick={() => {
              onSelect('new');
            }}
            icon={<PlusIcon className="w-5 h-5 mr-2" />}
            text="New Authenticator"
          />

          <SecondaryButton
            onClick={() => {
              onSelect('sda');
            }}
            text='Import from SDA maFile'
            icon={<CloudDownloadIcon className="w-5 h-5 mr-2" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">Add another account:</p>
        <div className="flex space-x-2">
          <SecondaryButton
            onClick={() => {
              onSelect('new');
            }}
            text="New Authenticator"
          />
          <SecondaryButton
            onClick={() => {
              onSelect('sda');
            }}
            text="Import from SDA"
          />
        </div>
      </div>
    </div>
  );
}
