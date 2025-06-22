
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { fetchUserData } from '@/utils/authUtils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log('🔧 Iniciando useAuthState...');
    
    // Função para processar mudanças de autenticação
    const handleAuthChange = async (event: string, session: any) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'sem sessão');
      
      if (!mounted) {
        console.log('⚠️ Componente desmontado, ignorando mudança');
        return;
      }

      try {
        if (session?.user) {
          console.log('👤 Processando usuário logado...');
          const userData = await fetchUserData(session.user.email);
          if (mounted) {
            console.log('✅ Dados do usuário carregados:', userData);
            setUser(userData);
            setLoading(false);
          }
        } else {
          console.log('🚪 Usuário não logado');
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
      }
    };

    // Verificar sessão atual primeiro
    const initializeAuth = async () => {
      try {
        console.log('🔍 Verificando sessão inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          throw error;
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

    // Escutar mudanças de autenticação
    console.log('👂 Configurando listener de auth...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Inicializar
    initializeAuth();

    return () => {
      console.log('🧹 Limpando listeners de auth...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log('📊 Estado atual - Loading:', loading, 'User:', user?.email || 'nenhum');

  return { user, setUser, loading, setLoading };
};
