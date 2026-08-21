import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LabReportAnalysis } from '../types.js';
import {
  signInWithGoogle,
  logoutFirebase,
  syncUserProfileToFirestore,
  auth,
  isFirebaseInitialized,
  firebaseConfig
} from '../lib/firebase.js';

interface SignupParams {
  name: string;
  email: string;
  password: string;
  role?: 'patient' | 'doctor';
  phone?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  specialty?: string;
  qualification?: string;
  department?: string;
  licenseNumber?: string;
  hospitalAffiliation?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  activeReport: LabReportAnalysis | null;
  firebaseConnected: boolean;
  firebaseProjectId: string;
  setActiveReport: (report: LabReportAnalysis | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithGoogle: (role?: 'patient' | 'doctor') => Promise<{ success: boolean; user?: User; error?: string }>;
  signup: (params: SignupParams) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mediverse_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeReport, setActiveReport] = useState<LabReportAnalysis | null>(() => {
    try {
      const saved = localStorage.getItem('mediverse_active_report');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (activeReport) {
      localStorage.setItem('mediverse_active_report', JSON.stringify(activeReport));
    } else {
      localStorage.removeItem('mediverse_active_report');
    }
  }, [activeReport]);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('mediverse_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.id) {
          syncUserProfileToFirestore(data.user.id, data.user).catch(() => {});
        }
      } else {
        localStorage.removeItem('mediverse_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch me:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' };
      }
      localStorage.setItem('mediverse_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user?.id) {
        syncUserProfileToFirestore(data.user.id, data.user).catch(() => {});
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: 'Network error during login.' };
    }
  };

  const loginWithGoogle = async (role: 'patient' | 'doctor' = 'patient') => {
    try {
      setIsLoading(true);
      const fbUser = await signInWithGoogle();
      if (!fbUser || !fbUser.email) {
        setIsLoading(false);
        return { success: false, error: 'Google sign-in was cancelled or returned no email.' };
      }

      // Exchange / register Firebase Google user with MediVerse backend
      const res = await fetch('/api/auth/firebase-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split('@')[0],
          photoUrl: fbUser.photoURL,
          firebaseUid: fbUser.uid,
          role
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Failed to authenticate Google user.' };
      }

      localStorage.setItem('mediverse_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user?.id) {
        syncUserProfileToFirestore(data.user.id, data.user).catch(() => {});
      }
      setIsLoading(false);
      return { success: true, user: data.user };
    } catch (err: any) {
      setIsLoading(false);
      console.error('Google Sign-In Error:', err);
      return { success: false, error: err.message || 'Google sign-in error.' };
    }
  };

  const signup = async (params: SignupParams) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed.' };
      }
      localStorage.setItem('mediverse_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user?.id) {
        syncUserProfileToFirestore(data.user.id, data.user).catch(() => {});
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: 'Network error during signup.' };
    }
  };

  const logout = () => {
    logoutFirebase().catch(() => {});
    localStorage.removeItem('mediverse_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Update failed' };
      }
      setUser(data.user);
      if (data.user?.id) {
        syncUserProfileToFirestore(data.user.id, data.user).catch(() => {});
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Network error updating profile.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        activeReport,
        firebaseConnected: isFirebaseInitialized,
        firebaseProjectId: firebaseConfig.projectId,
        setActiveReport,
        login,
        loginWithGoogle,
        signup,
        logout,
        updateProfile,
        refreshUser
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

