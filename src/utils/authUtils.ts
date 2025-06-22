
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

// Função de login simplificada - agora funciona diretamente pela tabela usuarios_optica
export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('Tentando fazer login direto pela tabela...', email);
    
    // Buscar usuário diretamente na tabela usuarios_optica
    const { data: userData, error: dbError } = await supabase
      .from('usuarios_optica')
      .select(`
        *,
        opticas (
          id,
          nome
        )
      `)
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (dbError || !userData) {
      console.error('Usuário não encontrado na base:', dbError);
      return { success: false };
    }

    // Por enquanto, vamos aceitar qualquer senha para facilitar o teste
    // Em produção, você deveria implementar hash de senha
    console.log('Usuário encontrado:', userData);

    const userObj = {
      id: userData.user_id,
      name: userData.nome,
      email: userData.email,
      role: userData.role as 'admin' | 'funcionario',
      opticId: userData.optica_id,
      opticName: userData.opticas?.nome || null
    };

    console.log('Login realizado com sucesso para:', userObj.role);
    return { success: true, userData: userObj };

  } catch (error) {
    console.error('Erro durante login:', error);
    return { success: false };
  }
};

// Função de logout
export const performLogout = async (): Promise<void> => {
  try {
    console.log('Fazendo logout...');
    // Como não estamos usando o Auth do Supabase, apenas limpamos o estado local
  } catch (error) {
    console.error('Erro durante logout:', error);
  }
};

