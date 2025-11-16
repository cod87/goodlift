import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { PreferencesProvider } from './contexts/PreferencesContext'
import { UserProfileProvider } from './contexts/UserProfileContext'
import { WeekSchedulingProvider } from './contexts/WeekSchedulingContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initializePushNotifications } from './utils/pushNotificationInit'

const queryClient = new QueryClient()

// Initialize push notification subscription when app loads
// This will subscribe users when service worker is ready and permissions are granted
if ('serviceWorker' in navigator && 'PushManager' in window) {
  window.addEventListener('load', () => {
    initializePushNotifications();
  });
}

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