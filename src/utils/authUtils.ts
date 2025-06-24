
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

// Cache para evitar requisições desnecessárias
const userCache = new Map<string, { user: User | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para limpar completamente o estado de autenticação
export const cleanupAuthState = () => {
  console.log('🧹 Limpando estado de autenticação...');
  
  // Limpar todas as chaves relacionadas ao Supabase do localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Limpar do sessionStorage se estiver sendo usado
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
  
  // Limpar cache de usuários
  userCache.clear();
  
  console.log('✅ Estado de autenticação limpo');
};

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
    
    // Criar e executar a query com timeout de 5 segundos
    const queryBuilder = supabase
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

    const { data: userData, error: userError } = await withTimeout(
      Promise.resolve(queryBuilder), 
      5000
    );

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
      console.error('⏰ Timeout na busca de dados do usuário - retornando null');
      userCache.set(userEmail, { user: null, timestamp: Date.now() });
      return null;
    }
    
    console.error('❌ Erro ao processar dados do usuário:', error);
    userCache.set(userEmail, { user: null, timestamp: Date.now() });
    return null;
  }
};

export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('🔐 Iniciando processo de login para:', email);
    
    // ETAPA 1: Limpar estado de autenticação antes de tentar login
    cleanupAuthState();
    
    // ETAPA 2: Tentar logout global para garantir estado limpo
    try {
      console.log('🚪 Fazendo logout global preventivo...');
      await supabase.auth.signOut({ scope: 'global' });
    } catch (logoutError) {
      console.log('⚠️ Erro no logout preventivo (continuando):', logoutError);
      // Continuar mesmo se o logout falhar
    }
    
    // ETAPA 3: Aguardar um pouco para garantir que o estado foi limpo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // ETAPA 4: Tentar login
    console.log('🔑 Tentando login com Supabase Auth...');
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
    
    // ETAPA 5: Buscar dados complementares do usuário
    const userData = await fetchUserData(authData.user.email!);
    
    if (!userData) {
      console.log('⚠️ Dados do usuário não encontrados na tabela usuarios_optica');
      await supabase.auth.signOut();
      return { success: false };
    }

    console.log('🎉 Login completo com sucesso!');
    return { success: true, userData };

  } catch (error) {
    console.error('❌ Erro durante login:', error);
    // Limpar estado em caso de erro
    cleanupAuthState();
    return { success: false };
  }
};

export const performLogout = async (): Promise<void> => {
  try {
    console.log('🚪 Iniciando processo de logout...');
    
    // ETAPA 1: Limpar estado primeiro
    cleanupAuthState();
    
    // ETAPA 2: Tentar logout global
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Logout global realizado');
    } catch (error) {
      console.log('⚠️ Erro no logout global (continuando):', error);
      // Continuar mesmo se falhar
    }
    
    // ETAPA 3: Forçar refresh da página para garantir estado limpo
    console.log('🔄 Forçando refresh da página...');
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
    
  } catch (error) {
    console.error('❌ Erro durante logout:', error);
    // Mesmo com erro, limpar estado e forçar refresh
    cleanupAuthState();
    window.location.href = '/';
  }
};
