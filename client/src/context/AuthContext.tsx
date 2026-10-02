import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('collabdocs_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('collabdocs_access_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('collabdocs_access_token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
          localStorage.setItem('collabdocs_user', JSON.stringify(profile));
        } catch {
          // Token invalid and could not refresh
          setUser(null);
          setToken(null);
          localStorage.removeItem('collabdocs_access_token');
          localStorage.removeItem('collabdocs_refresh_token');
          localStorage.removeItem('collabdocs_user');
        }
      }
      setIsLoading(false);
    };

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    initAuth();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('collabdocs_access_token', res.accessToken);
    localStorage.setItem('collabdocs_refresh_token', res.refreshToken);
    localStorage.setItem('collabdocs_user', JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
  };

  const signup = async (email: string, password: string, name: string) => {
    const res = await authApi.signup({ email, password, name });
    localStorage.setItem('collabdocs_access_token', res.accessToken);
    localStorage.setItem('collabdocs_refresh_token', res.refreshToken);
    localStorage.setItem('collabdocs_user', JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('collabdocs_refresh_token') || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('collabdocs_access_token');
      localStorage.removeItem('collabdocs_refresh_token');
      localStorage.removeItem('collabdocs_user');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
