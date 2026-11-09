import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

const createDefaultProfile = (currentUser, overrides = {}) => ({
  uid: currentUser?.uid || overrides.uid || '',
  email: currentUser?.email || overrides.email || '',
  displayName: currentUser?.displayName || overrides.displayName || 'Trail Explorer',
  photoURL: currentUser?.photoURL || overrides.photoURL || '',
  homeTrail: overrides.homeTrail || '',
  location: overrides.location || '',
  bio: overrides.bio || '',
  preferredUnits: overrides.preferredUnits || 'miles',
  strava: {
    connected: false,
    accessToken: '',
    refreshToken: '',
    athleteId: null,
    expiresAt: null,
    connectedAt: null,
    lastSyncedAt: null,
    ...(overrides.strava || {}),
  },
  milesLogged: 0,
  trashBagsCollected: 0,
  issuesReported: 0,
  pointsBalance: 0,
  saplingsAvailable: 0,
  treesPlanted: 0,
  badgesEarned: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const profileNeedsSetup = (profile) => {
  if (!profile) return true;

  return !profile.displayName || !profile.homeTrail || !profile.location || !profile.bio || !profile.preferredUnits;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setError(null);

        if (!currentUser) {
          setUser(null);
          setUserProfile(null);
          setNeedsProfileSetup(false);
          return;
        }

        setUser(currentUser);

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        const profile = userDoc.exists()
          ? { ...createDefaultProfile(currentUser, userDoc.data()), ...userDoc.data() }
          : createDefaultProfile(currentUser, {
              displayName: currentUser.displayName || 'Trail Explorer',
            });

        if (!userDoc.exists()) {
          await setDoc(userDocRef, profile);
        }

        setUserProfile(profile);
        setNeedsProfileSetup(profileNeedsSetup(profile));
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message || 'Unable to load the user profile.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const ensureProfile = async (currentUser, profileOverrides = {}) => {
    if (!currentUser) return null;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const existingDoc = await getDoc(userDocRef);
    const nextProfile = existingDoc.exists()
      ? {
          ...createDefaultProfile(currentUser, existingDoc.data()),
          ...existingDoc.data(),
          ...profileOverrides,
          strava: {
            ...(existingDoc.data()?.strava || {}),
            ...(profileOverrides.strava || {}),
          },
          updatedAt: new Date(),
        }
      : createDefaultProfile(currentUser, profileOverrides);

    await setDoc(userDocRef, nextProfile, { merge: true });
    setUserProfile(nextProfile);
    setNeedsProfileSetup(profileNeedsSetup(nextProfile));
    return nextProfile;
  };

  const signUp = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: displayName || 'Trail Explorer' });

      const profile = await ensureProfile(result.user, {
        email,
        displayName: displayName || 'Trail Explorer',
        photoURL: result.user.photoURL || '',
      });

      return { user: result.user, profile };
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
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await ensureProfile(result.user, {
        email: result.user.email,
        displayName: result.user.displayName || 'Trail Explorer',
        photoURL: result.user.photoURL || '',
      });
      return { user: result.user, profile };
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
      setNeedsProfileSetup(false);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return null;

    try {
      setError(null);
      const userDocRef = doc(db, 'users', user.uid);
      const nextProfile = {
        ...(userProfile || createDefaultProfile(user)),
        ...updates,
        strava: {
          ...((userProfile && userProfile.strava) || {}),
          ...((updates && updates.strava) || {}),
        },
        saplingsAvailable: updates?.saplingsAvailable ?? (userProfile?.saplingsAvailable ?? 0),
        treesPlanted: updates?.treesPlanted ?? (userProfile?.treesPlanted ?? 0),
        updatedAt: new Date(),
      };

      await setDoc(userDocRef, nextProfile, { merge: true });
      setUserProfile(nextProfile);
      setNeedsProfileSetup(profileNeedsSetup(nextProfile));
      return nextProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const completeProfileSetup = async (profileData) => {
    if (!user) {
      throw new Error('You must be logged in before saving your profile.');
    }

    const nextProfile = {
      ...(userProfile || createDefaultProfile(user)),
      uid: user.uid,
      email: user.email || userProfile?.email || '',
      displayName: profileData.displayName,
      homeTrail: profileData.homeTrail,
      location: profileData.location,
      bio: profileData.bio,
      preferredUnits: profileData.preferredUnits || 'miles',
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), nextProfile, { merge: true });
    setUserProfile(nextProfile);
    setNeedsProfileSetup(false);
    return nextProfile;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        needsProfileSetup,
        signUp,
        logIn,
        signInWithGoogle,
        logOut,
        updateUserProfile,
        completeProfileSetup,
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
