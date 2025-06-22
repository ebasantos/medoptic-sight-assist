
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types/auth';

// Função para buscar dados do usuário no banco
export const fetchUserData = async (supabaseUser: SupabaseUser): Promise<User | null> => {
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

// Função de login simplificada - sem verificação de confirmação de email
export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('Tentando fazer login:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login:', error.message);
      return { success: false };
    }

    if (data.user) {
      console.log('Login do Supabase realizado, buscando dados do usuário...');
      
      // Aguardar um pouco para garantir que os dados foram inseridos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userData = await fetchUserData(data.user);
      if (!userData) {
        console.error('Usuário não encontrado no sistema');
        return { success: false };
      }
      
      console.log('Login realizado com sucesso para:', userData.role);
      return { success: true, userData };
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
