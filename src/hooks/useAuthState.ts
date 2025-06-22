
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { fetchUserData } from '@/utils/authUtils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log('Configurando listeners de autenticação...');
    
    // Função para processar mudanças de autenticação
    const handleAuthChange = async (event: string, session: any) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;

      try {
        if (session?.user) {
          // Buscar dados do usuário
          const userData = await fetchUserData(session.user.email);
          if (mounted) {
            setUser(userData);
          }
        } else {
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao processar mudança de auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Verificar sessão atual primeiro
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        await handleAuthChange('INITIAL_SESSION', session);
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Inicializar
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, setUser, loading, setLoading };
};
