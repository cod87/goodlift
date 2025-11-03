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

const AuthContext = createContext({});

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    // TEMPORARY: Skip Firebase auth for development
    const mockUser = { uid: 'dev-user', email: 'dev@example.com' };
    setCurrentUser(mockUser);
    setCurrentUserId(mockUser.uid);
    setLoading(false);
    return () => {};
    
    // const unsubscribe = onAuthStateChanged(auth, async (user) => {
    //   setCurrentUser(user);
    //   
    //   if (user) {
    //     // User is logged in, load their data from Firebase
    //     try {
    //       await loadUserDataFromCloud(user.uid);
    //     } catch (error) {
    //       console.error('Error loading user data:', error);
    //     }
    //   } else {
    //     // User is logged out, clear the current user ID
    //     setCurrentUserId(null);
    //   }
    //   
    //   setLoading(false);
    // });

    // return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout
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
