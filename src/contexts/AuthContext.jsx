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
import { isGuestMode, enableGuestMode, disableGuestMode } from '../utils/guestStorage';

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

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

  useEffect(() => {
    // Check if returning as guest on mount
    if (isGuestMode()) {
      setIsGuest(true);
      setCurrentUser({
        uid: 'guest',
        email: null,
        isGuest: true,
      });
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Real user is logged in
        setIsGuest(false);
        disableGuestMode();
        setCurrentUser(user);
        
        // Load their data from Firebase
        try {
          await loadUserDataFromCloud(user.uid);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else if (!isGuestMode()) {
        // User is logged out and not in guest mode
        setIsGuest(false);
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
    signup,
    login,
    logout,
    continueAsGuest,
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
