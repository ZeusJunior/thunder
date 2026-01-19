import { useState } from 'react';
import { ErrorMessage } from '../../ErrorMessage';
import SecondaryButton from '../../Form/SecondaryButton';
import PrimaryButton from '../../Form/PrimaryButton';
import PasswordInput from '../../Form/Input/Password';
import Input from '../../Form/Input/Input';

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

      {error && (<ErrorMessage message={error} />)}

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

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const loginInfo = {
      accountName,
      password,
      authCode,
    };

    window.electron.addAuthenticator(loginInfo)
      .then((result) => {
        if ('codeRequired' in result && result.codeRequired) {
          // Need to enter Steam Guard code
          setShowAuthCode(true);
          setError(result.message);
          return;
        }

        if ('steamId' in result) {
          // Successful login, 2FA process started
          setSteamId(result.steamId);
          setRecoveryCode(result.recoveryCode);
          nextStep();
        }
      })
      .catch((err: Error) => {
        setError(`Failed to add authenticator: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {showAuthCode ? (
        <div>
          <label htmlFor="authCode" className="block text-sm font-medium text-gray-700">
            Steam Guard code
          </label>
          <Input
            type="text"
            id="authCode"
            required
            autoFocus
            placeholder="Enter the Steam Guard code"
            className="mt-1 rounded-md shadow-sm"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
              Steam username
            </label>
            <Input
              type="text"
              id="accountName"
              required
              placeholder="Your Steam username"
              className="mt-1 rounded-md shadow-sm"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Steam password
            </label>
            <PasswordInput
              id="password"
              placeholder="Your Steam password"
              className="mt-1 rounded-md shadow-sm"
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
        <PrimaryButton
          type="submit"
          isLoading={isLoading}
          text='Next'
          loadingText='Logging in...'
        />
        <SecondaryButton
          onClick={onCancel}
          text='Cancel'
        />
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

  const handleFinalize = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    window.electron.finalizeAuthenticator(steamId, activationCode)
      .then(() => {
        nextStep();
      })
      .catch((err: Error) => {
        setError(`Failed to finalize authenticator: ${err.message}`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleFinalize} className="space-y-4">
      <div>
        <label htmlFor="authCode" className="block text-sm font-medium text-gray-700">
          Activation Code
        </label>
        <Input
          type="text"
          id="authCode"
          required
          autoFocus
          placeholder="Enter the activation code"
          className="mt-1 block rounded-md shadow-sm"
          value={activationCode}
          onChange={(e) => setActivationCode(e.target.value)}
        />
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> If you have a phone number linked to your account, then you&apos;ll be sent an SMS with an activation code. Otherwise, you&apos;ll receive the activation code by email.
        </p>
      </div>

      <div className="flex space-x-3">
        <PrimaryButton
          type="submit"
          isLoading={isLoading}
          text='Next'
          loadingText='Finalizing...'
        />
        <SecondaryButton
          onClick={onCancel}
          text='Cancel'
        />
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
        <PrimaryButton
          type="button"
          onClick={() => setSeen(true)}
          text='I have saved the recovery code'
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="recoveryCode" className="block text-sm font-medium text-gray-700">
          Recovery code
        </label>
        <Input
          type="text"
          id="recoveryCode"
          required
          autoFocus
          placeholder="Enter the recovery code to confirm"
          className="mt-1 rounded-md shadow-sm"
          value={enteredCode}
          onChange={(e) => setEnteredCode(e.target.value)}
        />
      </div>

      <PrimaryButton
        type="submit"
        text='Next'
      />
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
      <PrimaryButton
        type="button"
        onClick={onContinue}
        text='Continue'
      />
    </div>
  );
}
