
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { fetchUserData } from '@/utils/authUtils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isProcessing = false; // Flag para evitar processamento simultâneo

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
          console.log('👤 Processando usuário logado...');
          const userData = await fetchUserData(session.user.email);
          if (mounted) {
            console.log('✅ Dados do usuário carregados:', userData);
            setUser(userData);
          }
        } else {
          console.log('🚪 Usuário não logado');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar mudança de auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
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

    // Configurar listener primeiro
    console.log('👂 Configurando listener de auth...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Inicializar depois
    initializeAuth();

    return () => {
      console.log('🧹 Limpando listeners de auth...');
      mounted = false;
      isProcessing = false;
      subscription.unsubscribe();
    };
  }, []);

  console.log('📊 Estado atual - Loading:', loading, 'User:', user?.email || 'nenhum');

  return { user, setUser, loading, setLoading };
};
