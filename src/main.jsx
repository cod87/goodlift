import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { UserProfileProvider } from './contexts/UserProfileContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <UserProfileProvider>
            <App />
          </UserProfileProvider>
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)