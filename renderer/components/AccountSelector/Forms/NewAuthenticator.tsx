import { useState } from 'react';

interface NewAuthenticatorProps {
  onSuccess: (accountId: string) => void;
  onCancel: () => void;
}

export default function NewAuthenticator({ onSuccess, onCancel }: NewAuthenticatorProps) {
  /**
   * Step 0: Login with username and password / auth code (if required)
   * Step 1: Waiting for 2FA code to finalize setup
   * Step 2: Show recovery codes and finish
   * Step 3: Congratulations and redirect to account list
   */
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [steamId, setSteamId] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  const getStepContent = () => {
    switch (step) {
    case 0:
      return <LoginStep onCancel={onCancel} setError={setError} setSteamId={setSteamId} setRecoveryCode={setRecoveryCode} nextStep={() => setStep(1)} />;
    case 1:
      return <FinalizeStep onCancel={onCancel} setError={setError} nextStep={() => setStep(2)} steamId={steamId} />;
    case 2:
      return <CheckRecoveryCodeStep setError={setError} recoveryCode={recoveryCode} nextStep={() => setStep(3)} />;
    case 3:
      return <CongratulationsStep onContinue={() => onSuccess(steamId)} />;
    default:
      return null;
    }
  };

  return (
    <>
      {
        step < 3 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
            Add new authenticator
            </h3>
            <p className="text-sm text-gray-600">
            Set up a new Steam Guard authenticator for your account.
            </p>
          </div>
        )
      }

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {getStepContent()}
    </>
  );
}

interface LoginStepProps {
  onCancel: () => void;
  setError: (error: string) => void;
  setSteamId: (id: string) => void;
  setRecoveryCode: (code: string) => void;
  nextStep: () => void;
}

function LoginStep({ onCancel, setError, setSteamId, setRecoveryCode, nextStep }: LoginStepProps) {
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [authCode, setAuthCode] = useState<string | undefined>();
  const [showAuthCode, setShowAuthCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const loginInfo = {
      accountName,
      password,
      authCode,
    };

    const result = await window.ipc.invoke('add-authenticator-login', loginInfo);
    if (result.codeRequired) {
      setShowAuthCode(true);
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (!result.success) {
      console.error('Error adding authenticator:', result.error);
      setError(`Failed to add authenticator: ${result.error}`);
      setIsLoading(false);
      return;
    }

    // Successful login, 2FA process started
    setSteamId(result.steamId);
    setRecoveryCode(result.recoveryCode);
    nextStep();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {showAuthCode ? (
        <div>
          <label htmlFor="authCode" className="block text-sm font-medium text-gray-700">
              Steam Guard Code
          </label>
          <input
            type="text"
            id="authCode"
            required
            autoFocus
            placeholder="Enter the Steam Guard code"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
            Steam Username
            </label>
            <input
              type="text"
              id="accountName"
              required
              placeholder="Your Steam username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Steam Password
            </label>
            <input
              type="password"
              id="password"
              required
              placeholder="Your Steam password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> You will be prompted to enter a Steam Guard code after logging in.
            </p>
          </div>
        </>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mx-auto"></div>
          ) : (
            'Next'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface FinalizeStepProps {
  onCancel: () => void;
  setError: (error: string) => void;
  nextStep: () => void;
  steamId: string;
}

function FinalizeStep({ onCancel, setError, nextStep, steamId }: FinalizeStepProps) {
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await window.ipc.invoke('add-authenticator-finalize', { steamId, activationCode });
    if (!result.success) {
      setError(`Failed to finalize authenticator: ${result.error || 'Unknown error'}`);
      setIsLoading(false);
      return;
    }

    // Successful, show recovery code in next step
    nextStep();
  };

  return (
    <form onSubmit={handleFinalize} className="space-y-4">
      <div>
        <label htmlFor="authCode" className="block text-sm font-medium text-gray-700">
        Activation Code
        </label>
        <input
          type="text"
          id="authCode"
          required
          autoFocus
          placeholder="Enter the activation code"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value)}
        />
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-700">
          <strong>Node:</strong>If you have a phone number linked to your account, then you&apos;ll be sent an SMS with an activation code. Otherwise, you&apos;ll receive the activation code by email.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mx-auto"></div>
          ) : (
            'Next'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

interface CheckRecoveryCodeStepProps {
  setError: (error: string) => void;
  recoveryCode: string;
  nextStep: () => void;
}

function CheckRecoveryCodeStep({ setError, recoveryCode, nextStep }: CheckRecoveryCodeStepProps) {
  // Make sure they've saved the recovery code, ask for them to re-enter it
  const [enteredCode, setEnteredCode] = useState('');
  const [seen, setSeen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enteredCode.toUpperCase() === recoveryCode.toUpperCase()) {
      nextStep();
      return;
    }
    
    setError('Recovery code is incorrect');
  };

  if (!seen) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-700">
            <strong>Important:</strong> Please save this recovery code securely. You will need this code to recover your account if you lose access to your authenticator.
          </p>
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-md p-4">
          <p className="text-lg font-mono text-gray-900 break-all">{recoveryCode}</p>
        </div>
        <button
          type="button"
          onClick={() => setSeen(true)}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          I have saved the recovery code
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="recoveryCode" className="block text-sm font-medium text-gray-700">
          Recovery Code
        </label>
        <input
          type="text"
          id="recoveryCode"
          required
          autoFocus
          placeholder="Enter the recovery code to confirm"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={enteredCode}
          onChange={(e) => setEnteredCode(e.target.value)}
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Next
        </button>
      </div>
    </form>
  );
}

interface CongratulationsStepProps {
  onContinue: () => void;
}

function CongratulationsStep({ onContinue }: CongratulationsStepProps) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Authenticator Added!</h2>
      <p className="text-gray-700 mb-6">
        A Steam Guard authenticator has been successfully added to your account!
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Continue
      </button>
    </div>
  );
}
