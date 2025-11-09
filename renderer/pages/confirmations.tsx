import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { Confirmation } from '../../main/types';
import Popup from '../components/Popup/Popup';

interface LoadingConfirmations extends Confirmation {
  isLoading?: boolean;
}

export default function ConfirmationsPage() {
  const [confirmations, setConfirmations] = useState<LoadingConfirmations[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const [showAcceptAllModal, setShowAcceptAllModal] = useState(false);

  const getConfirmations = () => {
    setIsLoading(true);
    window.electron.getConfirmations()
      .then((confs) => {
        setConfirmations(confs);
      })
      .catch((err: Error) => {
        setError(err.message || 'An unknown error occurred');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getConfirmations();
  }, []);

  const handleConfirmationAction = (id: number, key: string, accept: boolean) => {
    // Find the confirmation and set it to loading
    setConfirmations((prev) =>
      prev.map((conf) =>
        conf.id === id ? { ...conf, isLoading: true } : conf
      )
    );

    window.electron.respondToConfirmation(id, key, accept)
      .then(() => {
        setConfirmations((prev) => prev.filter((conf) => conf.id !== id));
      })
      .catch((err: Error) => {
        // On error, unset loading state
        setConfirmations((prev) =>
          prev.map((conf) =>
            conf.id === id ? { ...conf, isLoading: false } : conf
          )
        );
        setError(err.message || 'An unknown error occurred');
      });
  };

  const handleAcceptAll = async () => {
    setShowAcceptAllModal(false);
    setIsAcceptingAll(true);
    setError('');

    try {
      await window.electron.acceptAllConfirmations();
      // Refresh confirmations after accepting all
      getConfirmations();
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsAcceptingAll(false);
    }
  };

  return (
    <>
      <Head>
        <title>Confirmations - Thunder</title>
      </Head>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Confirmations
          </h1>
          {!isLoading && confirmations.length > 0 && (
            <button
              onClick={() => setShowAcceptAllModal(true)}
              disabled={isAcceptingAll}
              className={
                `px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${isAcceptingAll
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {isAcceptingAll ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Processing...
                </>
              ) : (
                `Accept all (${confirmations.length})`
              )}
            </button>
          )}
        </div>

        {/* TODO: Make error alert reusable */}
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading confirmations...</p>
            </div>
          </div>
        )}

        {!isLoading && confirmations.length === 0 && (
          <p className="text-gray-600">No pending confirmations.</p>
        )}
        {!isLoading && confirmations.length > 0 && (
          <div className="relative">
            {isAcceptingAll ? (
              <>
                <div className="bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                  <div className="text-center p-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-green-600 font-medium">Accepting all confirmations...</p>
                  </div>
                </div>
              </>
            ) : (
              <ul className="space-y-4">
                {confirmations.map((conf) => (
                  <li key={conf.id} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Image src={conf.icon} alt={conf.title} className="w-12 h-12 rounded-lg mr-4" width={48} height={48} />
                        <div className="flex-1">
                          <h3 className="font-bold">{conf.title}</h3>
                          <p className="text-sm text-gray-500">{conf.sending}</p>
                          {conf.receiving && <p className="text-sm text-gray-500">{conf.receiving}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">{new Date(conf.time).toLocaleString()}</p>
                        <div className="flex">
                          <button
                            onClick={() => handleConfirmationAction(conf.id, conf.key, true)}
                            disabled={conf.isLoading || isAcceptingAll}
                            className={
                              `px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ${conf.isLoading || isAcceptingAll
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                              }`}
                          >
                            {conf.isLoading ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleConfirmationAction(conf.id, conf.key, false)}
                            disabled={conf.isLoading || isAcceptingAll}
                            className={
                              `px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer ml-2 ${conf.isLoading || isAcceptingAll
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                              }`}
                          >
                            {conf.isLoading ? 'Processing...' : 'Decline'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}


          </div>
        )}

        {showAcceptAllModal && (
          <Popup title="Accept all confirmations" close={() => setShowAcceptAllModal(false)}>
            <p className="text-gray-600 mb-3">
              Are you sure you want to accept all pending confirmations? This action cannot be undone.
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Accept all
              </button>
            </div>
          </Popup>
        )}
      </div>
    </>
  );
}
