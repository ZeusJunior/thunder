import React, { useState } from 'react';
import Head from 'next/head';
import { PageContainer } from '../components/Layout/PageContainer';
import { PageHeader } from '../components/Layout/PageHeader';
import Popup from '../components/Popup/Popup';
import PrimaryButton from '../components/Form/PrimaryButton';
import CopyIcon from '../components/Icons/Copy';
import { ErrorMessage } from '../components/ErrorMessage';
import { WarningMessage } from '../components/WarningMessage';
import PasswordInput from '../components/Form/Input/Password';
import Textarea from '../components/Form/Input/Textarea';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChangePassword = async () => {
    setError('');
    setSuccess(false);

    // Validate inputs
    if (!currentPassword.trim()) {
      setError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      const result = await window.electron.config.changePassword(currentPassword, newPassword, confirmPassword);

      if (!result.success) {
        throw new Error(result.error || 'Failed to change password');
      }

      setSuccess(true);
      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setError(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  if (!isOpen) return null;

  return (
    <Popup title='Change password' close={handleClose}>
      {success ? (
        <div className="bg-green-100 border border-green-300 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-green-800">Success!</h3>
          <p className="mt-1 text-sm text-green-700">
            Your password has been changed successfully!
            <br />This popup will close automatically.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-md"
                placeholder="Current password"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-md"
                placeholder="New password (min 6 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                className="rounded-md"
                placeholder="Confirm new password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          <PrimaryButton
            onClick={handleChangePassword}
            text="Change password"
          />
        </>
      )}
    </Popup>
  );
}

export default function SettingsPage() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
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
          <SettingSection title="Security">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Change password</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Used to unlock the app and encrypt your data.
                </p>
                <div className='w-[25%]'>
                  <PrimaryButton
                    onClick={() => setShowChangePasswordModal(true)}
                    text="Change password"
                  />
                </div>
              </div>
            </div>
          </SettingSection>

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
              <button
                onClick={() => window.electron.showAppDataDirectory()}
                className="text-blue-600 hover:underline mt-2 cursor-pointer"
              >
                View app data directory
              </button>
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
            <Textarea
              value={exportedData || ''}
              readOnly
              rows={6}
              className='font-mono bg-gray-50'
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
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="rounded-md"
              placeholder="Password"
              autoFocus
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

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
        }}
      />
    </>
  );
}
