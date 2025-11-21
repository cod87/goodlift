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

// Defer push notification initialization to improve initial load time
// Initialize only after app is fully loaded and idle
if ('serviceWorker' in navigator && 'PushManager' in window) {
  // Use requestIdleCallback to initialize during browser idle time
  const initWhenIdle = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import('./utils/pushNotificationInit').then(({ initializePushNotifications }) => {
          initializePushNotifications();
        });
      }, { timeout: 3000 }); // Fallback to 3s if browser stays busy
    } else {
      // Fallback for browsers without requestIdleCallback (Safari)
      setTimeout(() => {
        import('./utils/pushNotificationInit').then(({ initializePushNotifications }) => {
          initializePushNotifications();
        });
      }, 2000); // Delay 2s to allow app to load first
    }
  };
  
  window.addEventListener('load', initWhenIdle);
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