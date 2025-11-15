import React, { useState } from 'react';
import Head from 'next/head';
import { PageContainer } from '../components/Layout/PageContainer';
import { PageHeader } from '../components/Layout/PageHeader';
import Popup from '../components/Popup/Popup';
import PrimaryButton from '../components/Form/PrimaryButton';
import CopyIcon from '../components/Icons/Copy';

export default function SettingsPage() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedData, setExportedData] = useState<string | null>(null);

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200">{title}</h3>
      {children}
    </div>
  );

  const handleExportSecrets = async () => {
    try {
      const secrets = await window.electron.exportTradingBotSecrets();
      setExportedData(JSON.stringify(secrets, null, 2));
      setShowExportModal(true);
    } catch {
      alert('Failed to export secrets. Please try again.');
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
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Security Warning</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    {'These secrets are your authenticator. If you don\'t know what they are used for, don\'t export them :)'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm my-3">
              Export your Steam authentication secrets. This includes your identity secret and shared secret.
            </p>

            <div className='w-[15%]'>
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
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <h3 className="text-sm font-medium text-red-800">Handle with Care!</h3>
            <p className="mt-1 text-sm text-red-700">
              These secrets provide full access to your Steam {'account\'s'} auth codes and confirmations. Keep them secure in a password manager!
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exported Data:
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
    </>
  );
}