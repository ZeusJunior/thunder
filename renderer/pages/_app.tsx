import React, { useState, useEffect } from 'react'
import type { AppProps } from 'next/app'
import PasswordAuth from '../components/PasswordAuth'

import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      // Check if config file exists
      const configExists = await window.ipc.invoke('check-config-exists')
      setIsFirstTime(!configExists)
      setIsLoading(false)
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsFirstTime(true)
      setIsLoading(false)
    }
  }

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <PasswordAuth 
        isFirstTime={isFirstTime} 
        onAuthenticated={handleAuthenticated}
      />
    )
  }

  return <Component {...pageProps} />
}

export default MyApp
