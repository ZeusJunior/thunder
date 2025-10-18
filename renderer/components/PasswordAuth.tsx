import Head from 'next/head';
import React, { useState } from 'react'

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

      try {
        const result = await window.ipc.invoke('create-encrypted-config', password);
        if (result.success) {
          onAuthenticated();
        } else {
          setError(result.error || 'Failed to create encrypted configuration');
        }
      } catch (error) {
        setError('An unexpected error occurred');
      }
    } else {
      // Existing config - verify password
      try {
        const result = await window.ipc.invoke('verify-password', password);
        if (result.success) {
          onAuthenticated();
        } else {
          setError(result.error || 'Invalid password');
        }
      } catch (error) {
        setError('An unexpected error occurred');
      }
    }

    setIsLoading(false);
  }

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

			{error && (
				<div className="text-red-600 text-sm text-center">
				{error}
				</div>
			)}

			<div>
				<button
				type="submit"
				disabled={isLoading}
				className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
				>
				{isLoading ? (
					<span className="flex items-center">
					<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Processing...
					</span>
				) : (
					isFirstTime ? 'Create Password' : 'Unlock'
				)}
				</button>
			</div>
			</form>
		</div>
		</div>
	</>
  )
}