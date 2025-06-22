
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

// Cache para evitar requisições desnecessárias
const userCache = new Map<string, { user: User | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para criar timeout em promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
    )
  ]);
};

export const fetchUserData = async (userEmail: string): Promise<User | null> => {
  try {
    console.log('🔍 Buscando dados do usuário por email:', userEmail);
    
    // Verificar cache primeiro
    const cached = userCache.get(userEmail);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('💾 Dados encontrados no cache');
      return cached.user;
    }
    
    // Adicionar timeout de 1 segundo na consulta
    const queryPromise = supabase
      .from('usuarios_optica')
      .select(`
        *,
        opticas (
          id,
          nome
        )
      `)
      .eq('email', userEmail)
      .maybeSingle();

    const { data: userData, error: userError } = await withTimeout(queryPromise, 1000);

    console.log('📊 Resultado da busca por email:', { userData, userError });

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError);
      userCache.set(userEmail, { user: null, timestamp: Date.now() });
      return null;
    }

    if (userData) {
      const userObj: User = {
        id: userData.id,
        name: userData.nome,
        email: userData.email,
        role: userData.role as 'admin' | 'funcionario',
        opticId: userData.optica_id,
        opticName: userData.opticas?.nome || null
      };
      console.log('✅ Dados do usuário processados:', userObj);
      
      // Salvar no cache
      userCache.set(userEmail, { user: userObj, timestamp: Date.now() });
      return userObj;
    }

    console.log('⚠️ Usuário não encontrado na tabela usuarios_optica');
    userCache.set(userEmail, { user: null, timestamp: Date.now() });
    return null;
  } catch (error) {
    if (error instanceof Error && error.message === 'TIMEOUT') {
      console.error('⏰ Timeout na busca de dados do usuário - fazendo logout automático');
      
      // Fazer logout automático em caso de timeout
      try {
        await supabase.auth.signOut();
        // Limpar cache
        userCache.clear();
        // Recarregar a página para ir para login
        window.location.href = '/';
      } catch (logoutError) {
        console.error('❌ Erro ao fazer logout automático:', logoutError);
      }
      
      return null;
    }
    
    console.error('❌ Erro ao processar dados do usuário:', error);
    userCache.set(userEmail, { user: null, timestamp: Date.now() });
    return null;
  }
};

export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('🔐 Tentando login com Supabase Auth para:', email);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Erro no login:', authError);
      return { success: false };
    }

    if (!authData.user) {
      console.log('⚠️ Usuário não encontrado');
      return { success: false };
    }

    console.log('✅ Login realizado com sucesso no Auth:', authData.user.email);
    
    const userData = await fetchUserData(authData.user.email!);
    
    if (!userData) {
      console.log('⚠️ Dados do usuário não encontrados na tabela usuarios_optica');
      await supabase.auth.signOut();
      return { success: false };
    }

    return { success: true, userData };

  } catch (error) {
    console.error('❌ Erro durante login:', error);
    return { success: false };
  }
};

export const performLogout = async (): Promise<void> => {
  try {
    console.log('🚪 Fazendo logout...');
    // Limpar cache ao fazer logout
    userCache.clear();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('❌ Erro durante logout:', error);
  }
};
