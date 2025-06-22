
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
      
      // Se não encontrar por user_id, tentar por email
      console.log('Tentando buscar por email:', supabaseUser.email);
      const { data: userByEmail, error: emailError } = await supabase
        .from('usuarios_optica')
        .select(`
          *,
          opticas (
            id,
            nome
          )
        `)
        .eq('email', supabaseUser.email)
        .single();

      if (emailError || !userByEmail) {
        console.error('Usuário não encontrado por email também:', emailError);
        return null;
      }

      // Se encontrou por email, atualizar o user_id
      console.log('Atualizando user_id para:', supabaseUser.id);
      const { error: updateError } = await supabase
        .from('usuarios_optica')
        .update({ user_id: supabaseUser.id })
        .eq('email', supabaseUser.email);

      if (updateError) {
        console.error('Erro ao atualizar user_id:', updateError);
      }

      userData = userByEmail;
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

// Função de login usando Supabase Auth
export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('Tentando fazer login com Supabase Auth...', email);
    
    // Primeiro, limpar qualquer sessão existente
    await supabase.auth.signOut();
    
    // Fazer login com Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erro no login do Supabase:', error);
      
      // Se o erro for de credenciais inválidas, verificar se o usuário existe na tabela customizada
      if (error.message.includes('Invalid login credentials')) {
        console.log('Verificando se usuário existe na tabela customizada...');
        
        const { data: customUser, error: customError } = await supabase
          .from('usuarios_optica')
          .select('*')
          .eq('email', email)
          .single();

        if (customUser && !customError) {
          console.log('Usuário encontrado na tabela customizada, mas não no Auth');
          return { 
            success: false, 
            userData: null 
          };
        }
      }
      
      return { success: false };
    }

    if (data.user) {
      // Buscar dados adicionais do usuário
      const userData = await fetchUserData(data.user);
      
      if (userData) {
        console.log('Login realizado com sucesso:', userData.role);
        return { success: true, userData };
      } else {
        console.log('Usuário autenticado mas não encontrado na tabela usuarios_optica');
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
