
import React, { createContext, useContext, ReactNode } from 'react';
import { AuthContextType, User } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { performLogin, performLogout } from '@/utils/authUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, setUser, loading, setLoading } = useAuthState();

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    const result = await performLogin(email, password);
    
    if (result.success && result.userData) {
      setUser(result.userData);
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const logout = async () => {
    await performLogout();
    setUser(null);
  };

  const isAuthenticated = !!user && !loading;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
