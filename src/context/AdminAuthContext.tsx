import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAdminSession,
  loginAdmin,
  registerAdmin,
  logoutAdmin,
  onAdminAuthChange,
  fetchUserProfile,
} from '../services/adminService';
import { Perfil } from '../types/database';

export type UserRole = 'admin' | 'cajero' | 'cliente';

interface AdminAuthContextType {
  user: any | null;
  session: any | null;
  profile: Perfil | null;
  role: UserRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoleForUser = useCallback(async (currentUser: any) => {
    if (!currentUser) {
      setProfile(null);
      setRole(null);
      return;
    }

    try {
      const p = await fetchUserProfile(currentUser.id);
      if (p) {
        setProfile(p);
        setRole(p.rol || 'cliente');
        return;
      }
    } catch {
      // Fallback
    }

    // Fallback: check JWT metadata
    const metaRole =
      currentUser.app_metadata?.rol ||
      currentUser.user_metadata?.rol ||
      'admin'; // En instalaciones nuevas sin tabla perfiles aún, el usuario inicial autenticado actúa como admin

    setRole((metaRole as UserRole) || 'admin');
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadRoleForUser(user);
    }
  }, [user, loadRoleForUser]);

  useEffect(() => {
    // Initial session load
    getAdminSession()
      .then(async (sess) => {
        setSession(sess);
        const currentUser = sess?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadRoleForUser(currentUser);
        }
      })
      .catch((err) => console.warn('Error reading admin session:', err))
      .finally(() => setIsLoading(false));

    // Listen to Supabase auth events
    const subscription = onAdminAuthChange(async (_event, sess) => {
      setSession(sess);
      const currentUser = sess?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await loadRoleForUser(currentUser);
      } else {
        setProfile(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadRoleForUser]);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await loginAdmin(email, pass);
      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        await loadRoleForUser(data.user);
      }
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
        if (data.user) {
          await loadRoleForUser(data.user);
        }
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
      setProfile(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = role === 'admin';
  const isStaff = role === 'admin' || role === 'cajero';

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAdmin,
        isStaff,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
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

