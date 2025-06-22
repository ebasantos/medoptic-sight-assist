
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types/auth';

// Função para buscar dados do usuário no banco
export const fetchUserData = async (email: string): Promise<User | null> => {
  try {
    console.log('Buscando dados do usuário por email:', email);
    
    // Buscar usuário na tabela usuarios_optica
    const { data: userData, error: userError } = await supabase
      .from('usuarios_optica')
      .select(`
        *,
        opticas (
          id,
          nome
        )
      `)
      .eq('email', email)
      .maybeSingle();

    console.log('Resultado da busca por email:', { userData, userError });

    if (userData) {
      const userObj = {
        id: userData.id,
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

// Função de login que funciona com usuários criados diretamente na tabela
export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('Tentando login direto na tabela para:', email);
    
    // Buscar usuário na tabela usuarios_optica com senha
    const { data: userData, error: userError } = await supabase
      .from('usuarios_optica')
      .select(`
        *,
        opticas (
          id,
          nome
        )
      `)
      .eq('email', email)
      .eq('password_hash', password) // Verificar senha diretamente
      .eq('ativo', true)
      .maybeSingle();

    if (userError) {
      console.error('Erro ao buscar usuário:', userError);
      return { success: false };
    }

    if (!userData) {
      console.log('Usuário não encontrado ou senha incorreta');
      return { success: false };
    }

    console.log('Login realizado com sucesso:', userData.email);
    
    const userObj = {
      id: userData.id,
      name: userData.nome,
      email: userData.email,
      role: userData.role as 'admin' | 'funcionario',
      opticId: userData.optica_id,
      opticName: userData.opticas?.nome || null
    };

    return { success: true, userData: userObj };

  } catch (error) {
    console.error('Erro durante login:', error);
    return { success: false };
  }
};

// Função de logout (simples limpeza de estado)
export const performLogout = async (): Promise<void> => {
  try {
    console.log('Fazendo logout...');
    // Apenas limpeza local, sem Supabase Auth
  } catch (error) {
    console.error('Erro durante logout:', error);
  }
};
