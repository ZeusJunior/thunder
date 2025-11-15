import Head from 'next/head';
import React, { useState } from 'react';
import { ErrorMessage } from './ErrorMessage';
import PrimaryButton from './Form/PrimaryButton';

interface PasswordAuthProps {
  isFirstTime: boolean
  onAuthenticated: () => void
}

export default function PasswordAuth({ isFirstTime, onAuthenticated }: PasswordAuthProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (isFirstTime) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      const result = await window.electron.config.create(password);
      if (result.success) {
        onAuthenticated();
      } else {
        setError(result.error || 'Failed to create encrypted configuration');
      }
    } else {
      // Existing config - verify password
      const result = await window.electron.config.initialize(password);
      if (result.success) {
        onAuthenticated();
      } else {
        setError(result.error || 'Invalid password');
      }
    }

    setIsLoading(false);
  };

  return (
    <>
      <Head>
        <title>{isFirstTime ? 'Set Up Password' : 'Enter Password'} - Thunder</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold">
              {isFirstTime ? 'Set Up Password' : 'Enter Password'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isFirstTime
                ? 'Create a password to secure your application'
                : 'Please enter your password to access Thunder'
              }
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                {/* TODO: Make inputs reusable */}
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${isFirstTime ? 'rounded-t-md' : 'rounded-md'}`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {isFirstTime && (
                <div>
                  <label htmlFor="confirm-password" className="sr-only">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm rounded-b-md"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && (<ErrorMessage message={error} />)}

            <PrimaryButton
              type="submit"
              isLoading={isLoading}
              text={isFirstTime ? 'Create password' : 'Unlock'}
              loadingText={isFirstTime ? 'Setting password...' : 'Unlocking...'}
            />
          </form>
        </div>
      </div>
    </>
  );
}
