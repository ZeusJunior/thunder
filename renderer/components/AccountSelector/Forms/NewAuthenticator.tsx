interface NewAuthenticatorProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export default function NewAuthenticator({ onSubmit, onCancel }: NewAuthenticatorProps) {
  return (
    <>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
         Add new authenticator
        </h3>
        <p className="text-sm text-gray-600">
         Set up a new Steam Guard authenticator for your account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Steam Username *
          </label>
          <input
            type="text"
            id="username"
            required
            placeholder="Your Steam username"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Steam Password *
          </label>
          <input
            type="password"
            id="password"
            required
            placeholder="Your Steam password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> You will be prompted to enter a Steam Guard code from your email after submitting this form to complete the authenticator setup.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Next
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
    </>
  );
}
