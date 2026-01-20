'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, name, role = 'manager') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Send email verification
      await sendEmailVerification(user);

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: role,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      // Sign out immediately after signup to force email verification
      await signOut(auth);

      return userCredential;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await signOut(auth); // Sign out the user
        const error = new Error('EMAIL_NOT_VERIFIED');
        error.code = 'EMAIL_NOT_VERIFIED';
        throw error;
      }

      return userCredential;
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        const err = new Error('Invalid email or password');
        err.code = 'auth/invalid-credential';
        throw err;
      } else if (error.code === 'auth/user-not-found') {
        const err = new Error('No account found with this email');
        err.code = 'auth/user-not-found';
        throw err;
      } else if (error.code === 'auth/wrong-password') {
        const err = new Error('Incorrect password');
        err.code = 'auth/wrong-password';
        throw err;
      } else if (error.code === 'auth/too-many-requests') {
        const err = new Error('Too many failed login attempts. Please try again later.');
        err.code = 'auth/too-many-requests';
        throw err;
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user, create profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          role: 'manager',
          emailVerified: user.emailVerified,
          authProvider: 'google',
          createdAt: new Date().toISOString(),
        });
      }

      return userCredential;
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        const err = new Error('Popup closed by user');
        err.code = 'auth/popup-closed-by-user';
        throw err;
      }
      const err = new Error('Failed to sign in with Google');
      err.code = error.code || 'unknown';
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userRole,
    signup,
    login,
    loginWithGoogle,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
