
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

// Função para buscar dados do usuário no banco
export const fetchUserData = async (userEmail: string): Promise<User | null> => {
  try {
    console.log('Buscando dados do usuário por email:', userEmail);
    
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
      .eq('email', userEmail)
      .maybeSingle();

    console.log('Resultado da busca por email:', { userData, userError });

    if (userData) {
      const userObj: User = {
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

// Função de login usando Supabase Auth
export const performLogin = async (email: string, password: string): Promise<{ success: boolean; userData?: User | null }> => {
  try {
    console.log('Tentando login com Supabase Auth para:', email);
    
    // Fazer login com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Erro no login:', authError);
      return { success: false };
    }

    if (!authData.user) {
      console.log('Usuário não encontrado');
      return { success: false };
    }

    console.log('Login realizado com sucesso no Auth:', authData.user.email);
    
    // Buscar dados do usuário na tabela usuarios_optica
    const userData = await fetchUserData(authData.user.email!);
    
    if (!userData) {
      console.log('Dados do usuário não encontrados na tabela usuarios_optica');
      // Fazer logout se não encontrar dados
      await supabase.auth.signOut();
      return { success: false };
    }

    return { success: true, userData };

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
