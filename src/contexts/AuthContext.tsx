
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'optic';
  opticId?: string;
  opticName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulação de login - substituir pela API real
    console.log('Tentativa de login:', { email, password });
    
    // Usuário admin demo
    if (email === 'admin@medoptic.com' && password === 'admin123') {
      setUser({
        id: '1',
        name: 'Administrador Master',
        email: 'admin@medoptic.com',
        role: 'admin'
      });
      return true;
    }
    
    // Usuário ótica demo
    if (email === 'otica@demo.com' && password === 'otica123') {
      setUser({
        id: '2',
        name: 'João Silva',
        email: 'otica@demo.com',
        role: 'optic',
        opticId: 'op1',
        opticName: 'Ótica Visual+'
      });
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
