import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';
import { loadUserDataFromCloud, setCurrentUserId } from '../utils/storage';
import { isGuestMode, enableGuestMode, disableGuestMode, getAllGuestData } from '../utils/guestStorage';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [hasGuestData, setHasGuestData] = useState(false);

  // Check if there's guest data to migrate
  const checkGuestData = () => {
    if (isGuestMode()) {
      const guestData = getAllGuestData();
      const hasData = Object.keys(guestData).length > 0;
      setHasGuestData(hasData);
      return hasData;
    }
    setHasGuestData(false);
    return false;
  };

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    if (isGuest) {
      // For guest users, just clear the guest state
      setIsGuest(false);
      disableGuestMode();
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
  };

  const continueAsGuest = () => {
    enableGuestMode();
    setIsGuest(true);
    // Create a guest user object for compatibility
    setCurrentUser({
      uid: 'guest',
      email: null,
      isGuest: true,
    });
  };

  // Handle user login with optional guest data migration
  const handleUserLogin = async (user, hadGuestData) => {
    setIsGuest(false);
    
    // Don't disable guest mode yet if there's data to migrate
    // The migration dialog will handle cleanup
    if (!hadGuestData) {
      disableGuestMode();
    }
    
    setCurrentUser(user);
    
    // Load user data from Firebase only if no migration is pending
    if (!hadGuestData) {
      try {
        await loadUserDataFromCloud(user.uid);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  };

  useEffect(() => {
    // Check if returning as guest on mount
    if (isGuestMode()) {
      setIsGuest(true);
      setCurrentUser({
        uid: 'guest',
        email: null,
        isGuest: true,
      });
      checkGuestData();
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Real user is logged in - check for guest data migration
        const hadGuestData = checkGuestData();
        await handleUserLogin(user, hadGuestData);
      } else if (!isGuestMode()) {
        // User is logged out and not in guest mode
        setIsGuest(false);
        setHasGuestData(false);
        setCurrentUser(null);
        setCurrentUserId(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isGuest,
    hasGuestData,
    signup,
    login,
    logout,
    continueAsGuest,
    checkGuestData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
