import React from 'react';
import Head from 'next/head';
import { useAccount } from '../context/AccountContext';
import ClockIcon from '../components/Icons/Clock';
import CopyIcon from '../components/Icons/Copy';
import { PageContainer } from '../components/Layout/PageContainer';
import { PageHeader } from '../components/Layout/PageHeader';
import PrimaryButton from '../components/Form/PrimaryButton';

export default function HomePage() {
  const { currentAccount, isLoading, seconds, authCode } = useAccount();

  if (isLoading || !currentAccount) {
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
      <PageContainer>
        <PageHeader title={`Welcome to Thunder Authenticator - ${currentAccount.personaName}`} />

        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Steam Guard Code
              </h2>

              {authCode ? (
                <>
                  <div className="mb-4">
                    <div className="text-3xl font-mono font-bold text-indigo-600 tracking-wider">
                      {authCode}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4" />
                      <span>Expires in {30 - seconds} seconds</span>
                    </div>

                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(seconds / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <PrimaryButton
                    onClick={() => navigator.clipboard.writeText(authCode)}
                    icon={<CopyIcon className="w-4 h-4" />}
                    text="Copy code"
                  />
                </>
              ) : (
                <div className="text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p>Loading auth code...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
