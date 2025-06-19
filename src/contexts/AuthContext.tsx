
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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados do usuário no banco
  const fetchUserData = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Buscando dados do usuário:', supabaseUser.id);
      
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

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        return null;
      }

      if (userData) {
        return {
          id: supabaseUser.id,
          name: userData.nome,
          email: userData.email,
          role: userData.role as 'admin' | 'funcionario',
          opticId: userData.optica_id,
          opticName: userData.opticas?.nome
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao processar dados do usuário:', error);
      return null;
    }
  };

  // Monitorar mudanças de autenticação
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user).then(userData => {
          setUser(userData);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const userData = await fetchUserData(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Tentando fazer login:', email);
      
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
        const userData = await fetchUserData(data.user);
        if (!userData) {
          console.error('Usuário não encontrado no sistema');
          await supabase.auth.signOut();
          setLoading(false);
          return false;
        }
        setUser(userData);
        console.log('Login realizado com sucesso');
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
