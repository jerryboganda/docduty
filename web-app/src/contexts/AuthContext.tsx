/**
 * Auth Context — Global authentication state
 * Provides user info, login/logout, role-based access throughout the app
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../lib/api';
import { getErrorMessage } from '../lib/support';
import type { ApiDoctorProfile, ApiFacilityAccount, ApiUser, AuthLoginResponse } from '../types/api';

interface User {
  id: string;
  phone: string;
  role: 'doctor' | 'facility_admin' | 'platform_admin';
  status: string;
  verificationStatus: string;
  email?: string;
  avatarUrl?: string | null;
  profile?: ApiDoctorProfile | ApiFacilityAccount;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; role?: User['role']; error?: string }>;
  register: (phone: string, password: string, role: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateAvatarUrl: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.get<ApiUser>('/auth/me');
      if (data) {
        setUser({
          id: data.id,
          phone: data.phone,
          role: data.role,
          status: data.status,
          verificationStatus: data.verification_status,
          email: data.email,
          avatarUrl: data.avatar_url || null,
          profile: data.profile,
        });
      } else {
        api.clearTokens();
        setUser(null);
      }
    } catch {
      api.clearTokens();
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (phone: string, password: string): Promise<{ success: boolean; role?: User['role']; error?: string }> => {
    try {
      const data = await api.post<AuthLoginResponse>('/auth/login', { phone, password }, true);
      api.setTokens(data.accessToken, data.refreshToken);
      setUser({
        id: data.user.id,
        phone: data.user.phone,
        role: data.user.role,
        status: data.user.status,
        verificationStatus: data.user.verification_status,
        email: data.user.email,
        avatarUrl: data.user.avatar_url || null,
        profile: data.user.profile,
      });
      return { success: true, role: data.user.role };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const register = async (phone: string, password: string, role: string, fullName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await api.post<AuthLoginResponse>('/auth/register', { phone, password, role, fullName }, true);
      api.setTokens(data.accessToken, data.refreshToken);
      setUser({
        id: data.user.id,
        phone: data.user.phone,
        role: data.user.role,
        status: 'active',
        verificationStatus: 'unverified',
      });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: getErrorMessage(err) };
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    api.clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const updateAvatarUrl = (url: string | null) => {
    setUser(prev => prev ? { ...prev, avatarUrl: url } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      updateAvatarUrl,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
