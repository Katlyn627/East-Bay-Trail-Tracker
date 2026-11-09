import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Create default profile if it doesn't exist
            const defaultProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || 'User',
              photoURL: currentUser.photoURL || '',
              milesLogged: 0,
              trashBagsCollected: 0,
              issuesReported: 0,
              pointsBalance: 0,
              badgesEarned: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(userDocRef, defaultProfile);
            setUserProfile(defaultProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });

      // Create user profile in Firestore
      const userProfile = {
        uid: result.user.uid,
        email,
        displayName,
        photoURL: '',
        milesLogged: 0,
        trashBagsCollected: 0,
        issuesReported: 0,
        pointsBalance: 0,
        badgesEarned: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      setUserProfile(userProfile);

      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logIn = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user profile exists, create if not
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        const newProfile = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'User',
          photoURL: result.user.photoURL || '',
          milesLogged: 0,
          trashBagsCollected: 0,
          issuesReported: 0,
          pointsBalance: 0,
          badgesEarned: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }

      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logOut = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    try {
      setError(null);
      const userDocRef = doc(db, 'users', user.uid);
      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };
      await setDoc(userDocRef, updatedData, { merge: true });
      setUserProfile((prev) => ({ ...prev, ...updatedData }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        signUp,
        logIn,
        signInWithGoogle,
        logOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
