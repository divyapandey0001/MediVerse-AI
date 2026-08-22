import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, LabReportAnalysis } from '../types.js';
import {
  signInWithGoogle,
  registerWithFirebaseEmail,
  sendFirebaseVerificationEmail,
  checkFirebaseEmailVerified,
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
  role?: UserRole;
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
  isEmailVerified: boolean;
  activeReport: LabReportAnalysis | null;
  firebaseConnected: boolean;
  firebaseProjectId: string;
  setActiveReport: (report: LabReportAnalysis | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithGoogle: (role?: UserRole) => Promise<{ success: boolean; user?: User; error?: string }>;
  signup: (params: SignupParams) => Promise<{ success: boolean; user?: User; error?: string; emailVerificationSent?: boolean }>;
  resendVerificationEmail: () => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyEmailStatus: () => Promise<{ isVerified: boolean; user?: User; error?: string }>;
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
        // Check Firebase email verification in background
        const fbVerified = await checkFirebaseEmailVerified().catch(() => false);
        if (fbVerified && data.user && data.user.emailVerified === false) {
          data.user.emailVerified = true;
          fetch('/api/auth/confirm-email-verification', {
            method: 'POST',
            headers: { Authorization: `Bearer ${currentToken}` }
          }).catch(() => {});
        }
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

      // Check if Firebase confirms email verification on login
      const fbVerified = await checkFirebaseEmailVerified().catch(() => false);
      if (fbVerified && data.user) {
        data.user.emailVerified = true;
        fetch('/api/auth/confirm-email-verification', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.token}` }
        }).catch(() => {});
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

  const loginWithGoogle = async (role: UserRole = 'patient') => {
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
      // 1. Create Firebase Auth user and send verification email
      let firebaseUserCredential: any = null;
      try {
        firebaseUserCredential = await registerWithFirebaseEmail(params.email, params.password);
        if (firebaseUserCredential?.user) {
          await sendFirebaseVerificationEmail(firebaseUserCredential.user);
        }
      } catch (fbErr: any) {
        console.warn('Firebase Auth signup step notice:', fbErr?.message || fbErr);
      }

      // 2. Register account in MediVerse backend
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
      return { success: true, user: data.user, emailVerificationSent: true };
    } catch (err: any) {
      return { success: false, error: 'Network error during signup.' };
    }
  };

  const resendVerificationEmail = async () => {
    if (!token && !user) {
      return { success: false, error: 'User must be signed in to resend verification email.' };
    }
    try {
      // Try sending via Firebase Auth client SDK
      try {
        await sendFirebaseVerificationEmail();
      } catch (fbErr) {
        console.warn('Firebase client verification email notice:', fbErr);
      }

      // Sync with backend audit & timestamp
      if (token) {
        const res = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Failed to resend verification email.' };
        }
        return { success: true, message: data.message || 'Verification email dispatched.' };
      }
      return { success: true, message: 'Verification email resent to your inbox.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error resending verification email.' };
    }
  };

  const verifyEmailStatus = async () => {
    if (!token && !user) {
      return { isVerified: false, error: 'User session not found.' };
    }
    try {
      // 1. Check live status from Firebase
      const fbVerified = await checkFirebaseEmailVerified();

      // 2. If Firebase confirmed or if user is verified, sync with backend
      if (fbVerified || user?.emailVerified) {
        if (token) {
          const res = await fetch('/api/auth/confirm-email-verification', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.user) {
            setUser(data.user);
            return { isVerified: true, user: data.user };
          }
        }
        if (user) {
          const updatedUser = { ...user, emailVerified: true };
          setUser(updatedUser);
          return { isVerified: true, user: updatedUser };
        }
      }

      // Also query backend status
      if (token) {
        const statusRes = await fetch('/api/auth/verify-email-status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.emailVerified) {
            const updatedUser = { ...user!, emailVerified: true };
            setUser(updatedUser);
            return { isVerified: true, user: updatedUser };
          }
        }
      }

      return { isVerified: false };
    } catch (err: any) {
      return { isVerified: false, error: err.message || 'Failed to verify email status.' };
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('mediverse_token');
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` }
      }).catch(() => {});
    }
    try {
      await logoutFirebase().catch(() => {});
    } catch (err) {
      console.warn('Firebase logout error:', err);
    }
    try {
      localStorage.removeItem('mediverse_token');
      localStorage.removeItem('mediverse_active_report');
      sessionStorage.clear();
    } catch (e) {}
    setToken(null);
    setUser(null);
    setActiveReport(null);
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

  const isEmailVerified = Boolean(user && user.emailVerified !== false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isEmailVerified,
        activeReport,
        firebaseConnected: isFirebaseInitialized,
        firebaseProjectId: firebaseConfig.projectId,
        setActiveReport,
        login,
        loginWithGoogle,
        signup,
        resendVerificationEmail,
        verifyEmailStatus,
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

