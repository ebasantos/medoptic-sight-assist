
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { fetchUserData } from '@/utils/authUtils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isProcessing = false;

    console.log('🔧 Iniciando useAuthState...');
    
    const handleAuthChange = async (event: string, session: any) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'sem sessão');
      
      if (!mounted || isProcessing) {
        console.log('⚠️ Componente desmontado ou já processando, ignorando mudança');
        return;
      }

      isProcessing = true;

      try {
        if (session?.user) {
          console.log('👤 Processando usuário logado...', event);
          
          // Defer data fetching to prevent deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const userData = await fetchUserData(session.user.email);
              if (mounted) {
                console.log('✅ Dados do usuário carregados:', userData);
                setUser(userData);
                setLoading(false);
              }
            } catch (error) {
              console.error('❌ Erro ao carregar dados do usuário:', error);
              if (mounted) {
                setUser(null);
                setLoading(false);
              }
            }
          }, 0);
          
        } else {
          console.log('🚪 Usuário não logado ou sessão finalizada');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar mudança de auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          isProcessing = false;
        }
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando sessão inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        console.log('📋 Sessão encontrada:', session ? 'SIM' : 'NÃO');
        await handleAuthChange('INITIAL_SESSION', session);
      } catch (error) {
        console.error('❌ Erro ao inicializar auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener first
    console.log('👂 Configurando listener de auth...');
    let subscription;
    
    try {
      const { data } = supabase.auth.onAuthStateChange(handleAuthChange);
      subscription = data.subscription;
    } catch (error) {
      console.error('❌ Erro ao configurar listener:', error);
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
      return;
    }

    // Initialize auth after setting up listener
    initializeAuth();

    return () => {
      console.log('🧹 Limpando listeners de auth...');
      mounted = false;
      isProcessing = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  console.log('📊 Estado atual - Loading:', loading, 'User:', user?.email || 'nenhum');

  return { user, setUser, loading, setLoading };
};
