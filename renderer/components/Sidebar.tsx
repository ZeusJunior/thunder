import React from 'react';
import Link from 'next/link';
import HomeIcon from './Icons/Home';
import GithubIcon from './Icons/Github';
import { useAccount } from '../context/AccountContext';
import Image from 'next/image';
import ArrowLRIcon from './Icons/ArrowsLR';

export default function Sidebar() {
  const { currentAccount } = useAccount();

  return (
    <div className="fixed left-0 top-0 w-48 h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo and Name */}
      <div className="flex items-center p-4 border-b border-gray-700">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <h1 className="text-xl font-semibold">Thunder</h1>
      </div>

      {/* Navigation */}
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
        </ul>
      </nav>

      <div className="p-2">
        <Link
          href="/debug"
          className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
        >
					Debug Info
        </Link>
      </div>

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
                  <ArrowLRIcon className="w-4 h-4 text-white" />
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
      <div className="p-2 border-t border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={() => window.ipc.send('open-new-window', { url: 'https://github.com/ZeusJunior/thunder', external: true })}
            className="cursor-pointer flex-1 flex items-center justify-center p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
            title="GitHub Repository"
          >
            <GithubIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
