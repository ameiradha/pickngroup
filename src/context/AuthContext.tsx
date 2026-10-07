import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { syncUserProfile } from '../services/classroomService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        try {
          await syncUserProfile({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          });
        } catch (e) {
          console.warn('Failed to sync user profile:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled. The Google sign-in window was closed.');
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError('Popup blocked by browser. Please allow popups for this site to sign in with Google.');
      } else {
        setAuthError(error.message || 'Failed to sign in with Google. Please try again.');
      }
      return null;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setAuthError(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthError('Failed to sign out. Please try again.');
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        logout,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
