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
      }, { timeout: 5000 }); // Fallback to 5s if browser stays busy (increased from 3s)
    } else {
      // Fallback for browsers without requestIdleCallback (Safari)
      setTimeout(() => {
        import('./utils/pushNotificationInit').then(({ initializePushNotifications }) => {
          initializePushNotifications();
        });
      }, 3000); // Delay 3s to allow app to load first
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