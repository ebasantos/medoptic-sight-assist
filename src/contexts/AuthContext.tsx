
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'funcionario';
  opticId?: string;
  opticName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
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

// Função para limpar estado de autenticação
const cleanupAuthState = () => {
  console.log('Limpando estado de autenticação...');
  // Remove todas as chaves relacionadas à autenticação
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário no banco
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Buscando dados do usuário:', supabaseUser.id, supabaseUser.email);
      
      // Buscar dados do usuário na tabela usuarios_optica
      const { data: userData, error: userError } = await supabase
        .from('usuarios_optica')
        .select(`
          *,
          opticas (
            id,
            nome
          )
        `)
        .eq('user_id', supabaseUser.id)
        .single();

      console.log('Resultado da busca:', { userData, userError });

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        return null;
      }

      if (userData) {
        const userObj = {
          id: supabaseUser.id,
          name: userData.nome,
          email: userData.email,
          role: userData.role as 'admin' | 'funcionario',
          opticId: userData.optica_id,
          opticName: userData.opticas?.nome
        };
        console.log('Dados do usuário processados:', userObj);
        return userObj;
      }

      console.log('Usuário não encontrado na tabela usuarios_optica');
      return null;
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      return null;
    }
  };

  // Monitorar mudanças de autenticação
  useEffect(() => {
    console.log('Configurando listeners de autenticação...');
    
    // Escutar mudanças de autenticação primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          // Buscar dados do usuário
          const userData = await fetchUserData(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Verificar sessão atual
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          const userData = await fetchUserData(session.user);
          setUser(userData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Tentando fazer login:', email);
      
      // Limpar estado anterior
      cleanupAuthState();
      
      // Tentar fazer logout global primeiro (para limpar sessões antigas)
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log('Logout anterior realizado');
      } catch (err) {
        console.log('Logout anterior ignorado:', err);
      }

      // Aguardar um pouco para garantir que o logout foi processado
      await new Promise(resolve => setTimeout(resolve, 200));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error.message);
        setLoading(false);
        return false;
      }

      if (data.user) {
        console.log('Login do Supabase realizado, buscando dados do usuário...');
        const userData = await fetchUserData(data.user);
        if (!userData) {
          console.error('Usuário não encontrado no sistema');
          await supabase.auth.signOut();
          setLoading(false);
          return false;
        }
        
        setUser(userData);
        console.log('Login realizado com sucesso para:', userData.role);
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error('Erro durante login:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('Fazendo logout...');
      cleanupAuthState();
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro durante logout:', error);
    }
  };

  const isAuthenticated = !!user && !loading;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
