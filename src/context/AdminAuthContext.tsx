import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAdminSession,
  loginAdmin,
  registerAdmin,
  logoutAdmin,
  onAdminAuthChange,
} from '../services/adminService';

interface AdminAuthContextType {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial session load
    getAdminSession()
      .then((sess) => {
        setSession(sess);
        setUser(sess?.user ?? null);
      })
      .catch((err) => console.warn('Error reading admin session:', err))
      .finally(() => setIsLoading(false));

    // Listen to Supabase auth events
    const subscription = onAdminAuthChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await loginAdmin(email, pass);
      setSession(data.session);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    try {
      const data = await registerAdmin(email, pass, name);
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await logoutAdmin();
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
