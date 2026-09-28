import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAdminSession,
  loginAdmin,
  registerAdmin,
  logoutAdmin,
  onAdminAuthChange,
  fetchUserProfile,
  createOrEnsureAdminProfile,
} from '../services/adminService';
import { Perfil } from '../types/database';

export type UserRole = 'admin' | 'administrador' | 'cajero' | 'cliente';

interface AdminAuthContextType {
  user: any | null;
  session: any | null;
  profile: Perfil | null;
  role: UserRole | null;
  isActive: boolean;
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

    const emailLower = (currentUser.email || '').toLowerCase().trim();
    const userId = currentUser.id;

    try {
      // 1. Obtener perfil desde public.perfiles usando perfiles.id = auth.uid()
      let p = await fetchUserProfile(userId);

      // Si no existe perfil en la base de datos (por ejemplo usuario recién creado en Auth)
      if (!p) {
        p = await createOrEnsureAdminProfile(
          userId,
          emailLower,
          currentUser.user_metadata?.nombre
        );
      }

      if (p) {
        setProfile(p);
        if (p.activo === false) {
          setRole('cliente');
          return;
        }
        const rawRol = (p.rol || '').toLowerCase().trim();
        const normalizedRole =
          rawRol === 'administrador' || rawRol === 'admin'
            ? 'admin'
            : rawRol === 'cajero'
            ? 'cajero'
            : rawRol === 'cliente'
            ? 'cliente'
            : 'admin';
        setRole(normalizedRole as UserRole);
        return;
      }
    } catch (err) {
      console.warn('Error consultando o creando perfil en Supabase:', err);
    }

    // 2. Si la base de datos no tiene el perfil o hubo error de red,
    // dado que el usuario inició sesión en el portal administrativo con credenciales válidas:
    const adminProfile: Perfil = {
      id: userId,
      nombre: currentUser.user_metadata?.nombre || emailLower.split('@')[0],
      rol: 'admin',
      activo: true,
      created_at: currentUser.created_at,
    };
    setProfile(adminProfile);
    setRole('admin');
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadRoleForUser(user);
    }
  }, [user, loadRoleForUser]);

  useEffect(() => {
    let isMounted = true;

    // Carga inicial de sesión
    getAdminSession()
      .then(async (sess) => {
        if (!isMounted) return;
        setSession(sess);
        const currentUser = sess?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadRoleForUser(currentUser);
        }
      })
      .catch((err) => console.warn('Error reading admin session:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Escuchar eventos de autenticación de Supabase
    const subscription = onAdminAuthChange(async (_event, sess) => {
      if (!isMounted) return;
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
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [loadRoleForUser]);

  const signIn = async (email: string, pass: string): Promise<void> => {
    const data = await loginAdmin(email, pass);
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        await loadRoleForUser(data.user);
      }
    }
  };

  const signUp = async (email: string, pass: string, name?: string): Promise<void> => {
    const data = await registerAdmin(email, pass, name);
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        await loadRoleForUser(data.user);
      }
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

  const isActive = profile?.activo !== false;
  const isAdmin = (role === 'admin' || role === 'administrador') && isActive;
  const isStaff = (role === 'admin' || role === 'administrador' || role === 'cajero') && isActive;

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isActive,
        isAdmin,
        isStaff,
        isLoading: isLoading || (Boolean(session) && role === null),
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

