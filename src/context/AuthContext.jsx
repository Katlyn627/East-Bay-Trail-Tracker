import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase';
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

const getNumericValue = (primaryValue, fallbackValue = 0) => {
  if (typeof primaryValue === 'number' && Number.isFinite(primaryValue)) return primaryValue;
  if (typeof fallbackValue === 'number' && Number.isFinite(fallbackValue)) return fallbackValue;
  return 0;
};

const getUniqueTrails = (profile) => {
  if (Array.isArray(profile?.uniqueTrails)) {
    return [...new Set(profile.uniqueTrails.filter((trail) => typeof trail === 'string' && trail.trim()))];
  }

  return [];
};

const createImpactMetrics = (profile = {}) => {
  const totalBags = getNumericValue(profile.totalBags, profile.trashBagsCollected);
  const totalWeightLbs = getNumericValue(profile.totalWeightLbs, 0);
  const totalMiles = getNumericValue(profile.totalMiles, profile.milesLogged);
  const totalHours = getNumericValue(profile.totalHours, profile.volunteerHours);
  const pointsBalance = getNumericValue(profile.pointsBalance, 0);
  const uniqueTrails = getUniqueTrails(profile);

  return {
    totalBags,
    totalWeightLbs,
    totalMiles,
    totalHours,
    uniqueTrails,
    pointsBalance,
  };
};

const createDefaultProfile = (currentUser, overrides = {}) => ({
  uid: currentUser?.uid || overrides.uid || '',
  email: currentUser?.email || overrides.email || '',
  displayName: currentUser?.displayName || overrides.displayName || 'Trail Explorer',
  photoURL: currentUser?.photoURL || overrides.photoURL || '',
  homeTrail: overrides.homeTrail || '',
  location: overrides.location || '',
  bio: overrides.bio || '',
  preferredUnits: overrides.preferredUnits || 'miles',
  ...createImpactMetrics(overrides),
  milesLogged: getNumericValue(overrides.milesLogged, overrides.totalMiles),
  volunteerHours: getNumericValue(overrides.volunteerHours, overrides.totalHours),
  trashBagsCollected: getNumericValue(overrides.trashBagsCollected, overrides.totalBags),
  issuesReported: 0,
  pointsBalance: getNumericValue(overrides.pointsBalance, 0),
  badgesEarned: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

const normalizeProfile = (currentUser, profile = {}) => {
  const defaults = createDefaultProfile(currentUser, profile);
  const metrics = createImpactMetrics({ ...defaults, ...profile });
  const mergedProfile = { ...defaults, ...profile, ...metrics };

  return {
    ...mergedProfile,
    trashBagsCollected: metrics.totalBags,
    milesLogged: metrics.totalMiles,
    volunteerHours: metrics.totalHours,
    pointsBalance: metrics.pointsBalance,
    uniqueTrails: metrics.uniqueTrails,
  };
};

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
          ? normalizeProfile(currentUser, userDoc.data())
          : normalizeProfile(currentUser, {
              displayName: currentUser.displayName || 'Trail Explorer',
            });

        const needsMetricsBackfill =
          !userDoc.exists() ||
          userDoc.data()?.totalBags === undefined ||
          userDoc.data()?.totalWeightLbs === undefined ||
          userDoc.data()?.totalMiles === undefined ||
          userDoc.data()?.totalHours === undefined ||
          !Array.isArray(userDoc.data()?.uniqueTrails);

        if (needsMetricsBackfill) {
          await setDoc(userDocRef, profile, { merge: true });
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
          ...normalizeProfile(currentUser, existingDoc.data()),
          ...profileOverrides,
          updatedAt: new Date(),
        }
      : normalizeProfile(currentUser, profileOverrides);

    const normalizedNextProfile = normalizeProfile(currentUser, nextProfile);

    await setDoc(userDocRef, normalizedNextProfile, { merge: true });
    setUserProfile(normalizedNextProfile);
    setNeedsProfileSetup(profileNeedsSetup(normalizedNextProfile));
    return normalizedNextProfile;
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
      const mergedProfile = {
        ...(userProfile || normalizeProfile(user)),
        ...(updates || {}),
        updatedAt: new Date(),
      };
      const nextProfile = normalizeProfile(user, mergedProfile);

      delete nextProfile.saplings;
      delete nextProfile.saplingsAvailable;
      delete nextProfile.seeds;
      delete nextProfile.plantedTrees;
      delete nextProfile.treeHistory;
      delete nextProfile.treesPlanted;

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

    const nextProfile = normalizeProfile(user, {
      ...(userProfile || normalizeProfile(user)),
      uid: user.uid,
      email: user.email || userProfile?.email || '',
      displayName: profileData.displayName,
      homeTrail: profileData.homeTrail,
      location: profileData.location,
      bio: profileData.bio,
      preferredUnits: profileData.preferredUnits || 'miles',
      updatedAt: new Date(),
    });

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
