import React from 'react';
import Head from 'next/head';
import { useAccount } from '../context/AccountContext';

export default function HomePage() {
  const { currentAccount, isLoading } = useAccount();

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Home - Thunder</title>
        </Head>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Home - Thunder</title>
      </Head>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">
         Welcome to Thunder Authenticator {currentAccount ? `- ${currentAccount.username}` : ''}
        </h1>
      </div>
    </>
  );
}
