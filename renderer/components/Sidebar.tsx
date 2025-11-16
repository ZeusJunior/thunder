import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import HomeIcon from './Icons/Home';
import GithubIcon from './Icons/Github';
import { useAccount } from '../context/AccountContext';
import Image from 'next/image';
import ArrowLRIcon from './Icons/ArrowsLR';
import Popup from './Popup/Popup';
import ExternalIcon from './Icons/External';
import DocumentCheckIcon from './Icons/DocumentCheck';
import SettingsIcon from './Icons/Settings';
import { ErrorMessage } from './ErrorMessage';
import PrimaryButton from './Form/PrimaryButton';

export default function Sidebar() {
  const { currentAccount } = useAccount();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [popupError, setPopupError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Perhaps our session expired, listen for event
    window.electron.events.onLoginRequired(() => {
      setIsPopupOpen(true);
    });

    return () => {
      window.electron.events.removeOnLoginRequired();
    };
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      return;
    }

    setIsLoggingIn(true);

    window.electron.loginAgain(password)
      .then(() => {
        setPassword('');
        setPopupError('');
        setIsPopupOpen(false);
      })
      .catch((err) => {
        setPopupError(err.message || 'An unknown error occurred');
      })
      .finally(() => {
        setIsLoggingIn(false);
      });
  };

  return (
    <>
      <div className="fixed left-0 top-0 w-48 h-screen bg-gray-900 text-white flex flex-col">
        <div className="flex items-center p-4 border-b border-gray-700">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
            <span className="font-bold text-sm">T</span>
          </div>
          <h1 className="text-xl font-semibold">Thunder</h1>
        </div>

        <nav className="flex-1 p-1">
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <HomeIcon className="w-5 h-5 mr-2" />
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/confirmations"
                className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <DocumentCheckIcon className="w-5 h-5 mr-2" />
                Confirmations
              </Link>
            </li>
            <li className="border-t border-gray-700 pt-1">
              <Link
                href="#"
                onClick={() => window.electron.openSteamWindow.community()}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <ExternalIcon className="w-5 h-5 mr-2" />
                <span className="mr-2">Steam</span>
              </Link>
            </li>
            <li>
              <Link
                href="#"
                onClick={() => window.electron.openSteamWindow.tradeOffers()}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <ExternalIcon className="w-5 h-5 mr-2" />
                <span className="mr-2">Trade offers</span>
              </Link>
            </li>
          </ul>
        </nav>

        {process.env.NODE_ENV === 'development' && (
          <div className="p-1">
            <Link
              href="/debug"
              className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Debug info
            </Link>
          </div>
        )}

        {currentAccount && (
          <div className="p-1 border-t border-gray-700">
            <div className="relative">
              <Link
                href="/change-account"
                className="w-full text-left p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center group"
              >
                <div className="flex-shrink-0 mr-3 relative">
                  <Image
                    src={currentAccount.avatarUrl}
                    className={'w-8 h-8 rounded-full'}
                    width={32}
                    height={32}
                    alt={`${currentAccount.personaName} avatar`}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <ArrowLRIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" title={currentAccount.personaName}>{currentAccount.personaName}</div>
                  <div className="text-xs text-gray-500 truncate" title={currentAccount.id64}>{currentAccount.id64}</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Icons */}
        <div className="p-1 border-t border-gray-700">
          <div className="flex space-x-1">
            <Link
              href="/settings"
              className="cursor-pointer flex-1 flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              title="App settings"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
            <button
              onClick={() => window.electron.openBrowser.github()}
              className="cursor-pointer flex-1 flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              title="GitHub Repository"
            >
              <GithubIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* TODO: Refactor popup to manage its own state more. Doesn't feel right to have password as part of sidebar state */}
      {isPopupOpen && (
        <Popup
          title={`Session expired. Please enter the password for "${currentAccount?.personaName}" to login again, then retry.`}
          close={() => setIsPopupOpen(false)}
        >

          {popupError && (<ErrorMessage message={popupError} />)}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Steam Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your Steam password"
                required
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setPassword('');
                  setPopupError('');
                  setIsPopupOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <div>
                <PrimaryButton
                  type="submit"
                  isLoading={isLoggingIn}
                  text="Login"
                  loadingText="Logging in..."
                />
              </div>
            </div>
          </form>
        </Popup>
      )}
    </>
  );
};
