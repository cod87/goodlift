import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { UserProfileProvider } from './contexts/UserProfileContext'
import { WeekSchedulingProvider } from './contexts/WeekSchedulingContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Push notification initialization is now handled in AuthContext after user login
// This ensures the FCM token is saved to Firestore with the correct user ID

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <UserProfileProvider>
            <WeekSchedulingProvider>
              <App />
            </WeekSchedulingProvider>
          </UserProfileProvider>
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)