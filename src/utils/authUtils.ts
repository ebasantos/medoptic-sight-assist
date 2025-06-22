
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types/auth';

// Função para buscar dados do usuário no banco
export const fetchUserData = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('Buscando dados do usuário:', supabaseUser.id, supabaseUser.email);
    
    // Buscar por user_id primeiro
    let { data: userData, error: userError } = await supabase
      .from('usuarios_optica')
      .select(`
        *,
        opticas (
          id,
          nome
        )
      `)
      .eq('user_id', supabaseUser.id)
      .maybeSingle();

    console.log('Resultado da busca por user_id:', { userData, userError });

    if (userData) {
      const userObj = {
        id: supabaseUser.id,
        name: userData.nome,
        email: userData.email,
        role: userData.role as 'admin' | 'funcionario',
        opticId: userData.optica_id,
        opticName: userData.opticas?.nome || null
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

// Função de login simples que funciona com usuários criados
export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('Tentando login para:', email);
    
    // Tentar login com Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erro no login do Supabase Auth:', error);
      return { success: false };
    }

    if (data.user) {
      console.log('Login realizado com sucesso no Auth:', data.user.email);
      
      // Buscar dados adicionais do usuário
      const userData = await fetchUserData(data.user);
      
      if (userData) {
        console.log('Login realizado com sucesso:', userData);
        return { success: true, userData };
      } else {
        console.error('Usuário autenticado mas não encontrado na tabela usuarios_optica');
        // Fazer logout se não encontrar dados do usuário
        await supabase.auth.signOut();
        return { success: false };
      }
    }

    return { success: false };

  } catch (error) {
    console.error('Erro durante login:', error);
    return { success: false };
  }
};

// Função de logout
export const performLogout = async (): Promise<void> => {
  try {
    console.log('Fazendo logout...');
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Erro durante logout:', error);
  }
};
