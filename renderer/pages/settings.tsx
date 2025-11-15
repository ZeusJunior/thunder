import React, { useState } from 'react';
import Head from 'next/head';
import { PageContainer } from '../components/Layout/PageContainer';
import { PageHeader } from '../components/Layout/PageHeader';
import Popup from '../components/Popup/Popup';
import PrimaryButton from '../components/Form/PrimaryButton';
import CopyIcon from '../components/Icons/Copy';
import { ErrorMessage } from '../components/ErrorMessage';
import { WarningMessage } from '../components/WarningMessage';

export default function SettingsPage() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [exportedData, setExportedData] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200">{title}</h3>
      {children}
    </div>
  );

  const handleExportSecrets = async () => {
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    setPasswordError('');

    try {
      const secrets = await window.electron.exportAccountSecrets(password);
      if ('error' in secrets) {
        throw new Error(secrets.error);
      }

      setExportedData(JSON.stringify(secrets, null, 2));
      setShowPasswordModal(false);
      setShowExportModal(true);
      setPassword('');
    } catch (error) {
      console.error('Failed to export secrets:', error);
      setPasswordError(error instanceof Error ? error.message : 'Invalid password or export failed');
    }
  };

  const copyToClipboard = () => {
    if (exportedData) {
      navigator.clipboard.writeText(exportedData);
      alert('Secrets copied to clipboard!');
    }
  };

  return (
    <>
      <Head>
        <title>Settings - Thunder</title>
      </Head>
      <PageContainer>
        <PageHeader title="Settings" />

        <div className="max-w-2xl">
          <SettingSection title="Export account secrets">
            <WarningMessage title="Security warning" message="These secrets are your authenticator. If you don't know what they are used for, don't export them :)" />

            <p className="text-sm my-3">
              Export your Steam authentication secrets. This includes your identity secret and shared secret.
            </p>

            <div className='w-[12%]'>
              <PrimaryButton
                onClick={handleExportSecrets}
                text="Export"
              />
            </div>
          </SettingSection>

          <SettingSection title="App info">
            <div className="text-sm text-gray-600">
              <div>Version: {process.env.VERSION}</div>
            </div>
          </SettingSection>
        </div>
      </PageContainer>

      {showExportModal && (
        <Popup title='Trading Bot Secrets' close={() => setShowExportModal(false)}>
          <ErrorMessage title="Handle with care!" message={'These secrets provide full access to your Steam account\'s auth codes and confirmations. Keep them secure in a password manager!'} />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exported data:
            </label>
            <textarea
              value={exportedData || ''}
              readOnly
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-md text-sm font-mono bg-gray-50"
            />
          </div>

          <PrimaryButton
            onClick={copyToClipboard}
            text="Copy to clipboard"
            icon={<CopyIcon className="h-4 w-4 mr-2" />}
          />
        </Popup>
      )}

      {showPasswordModal && (
        <Popup title='Authentication' close={() => setShowPasswordModal(false)}>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <h3 className="text-sm font-medium text-blue-800">Password required</h3>
            <p className="mt-1 text-sm text-blue-700">
              Please enter your Thunder password to reveal your account secrets
            </p>
          </div>

          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="w-full p-3 border border-gray-300 rounded-md text-sm"
              placeholder="Password..."
              autoFocus
              required
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          <PrimaryButton
            onClick={handlePasswordSubmit}
            text={'Reveal'}
          />
        </Popup>
      )}
    </>
  );
}