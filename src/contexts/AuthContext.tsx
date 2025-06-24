
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
    try {
      setLoading(true);
      console.log('Iniciando processo de login...');
      
      const result = await performLogin(email, password);
      
      if (result.success && result.userData) {
        setUser(result.userData);
        console.log('Login bem-sucedido:', result.userData.email);
        return true;
      }
      
      console.log('Falha no login');
      return false;
    } catch (error) {
      console.error('Erro durante login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Iniciando logout...');
      await performLogout();
      setUser(null);
      console.log('Logout concluído');
    } catch (error) {
      console.error('Erro durante logout:', error);
    }
  };

  const isAuthenticated = !!user && !loading;

  // Ensure we always provide a valid context value, even during initialization
  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
