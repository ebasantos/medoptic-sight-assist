import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OpticData {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  created_at: string;
  users: number;
  measurements: number;
}

interface DashboardStats {
  totalOpticas: number;
  opticasAtivas: number;
  opticasBloqueadas: number;
  totalUsuarios: number;
  totalAfericoes: number;
}

export const useAdminDashboard = () => {
  const [opticas, setOpticas] = useState<OpticData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOpticas: 0,
    opticasAtivas: 0,
    opticasBloqueadas: 0,
    totalUsuarios: 0,
    totalAfericoes: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 Buscando dados do dashboard admin...');
      
      // Verificar primeiro se o usuário tem permissão de admin
      console.log('🔒 Verificando permissões de admin...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário atual:', user?.email);
      
      // Buscar dados do usuário atual
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('usuarios_optica')
        .select('role, optica_id')
        .eq('user_id', user?.id)
        .single();
      
      if (currentUserError) {
        console.error('❌ Erro ao buscar dados do usuário atual:', currentUserError);
      } else {
        console.log('👥 Dados do usuário atual:', currentUserData);
      }

      // Buscar óticas
      console.log('📊 Buscando óticas...');
      const { data: opticasData, error: opticasError } = await supabase
        .from('opticas')
        .select('*')
        .order('created_at', { ascending: false });

      if (opticasError) {
        console.error('❌ Erro ao buscar óticas:', opticasError);
        throw opticasError;
      }

      console.log('✅ Óticas encontradas:', opticasData?.length || 0);

      // Buscar usuários - tentar sem filtros RLS primeiro
      console.log('👥 Buscando usuários...');
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios_optica')
        .select('optica_id, id, ativo, role, nome, email');

      if (usuariosError) {
        console.error('❌ Erro ao buscar usuários:', usuariosError);
        console.log('⚠️ Tentando buscar usuários com query mais simples...');
        
        // Tentar query mais simples
        const { data: usuariosSimple, error: usuariosSimpleError } = await supabase
          .from('usuarios_optica')
          .select('*');
          
        if (usuariosSimpleError) {
          console.error('❌ Erro na query simples também:', usuariosSimpleError);
        } else {
          console.log('✅ Query simples funcionou:', usuariosSimple?.length || 0);
        }
      } else {
        console.log('✅ Usuários encontrados:', usuariosData?.length || 0);
        console.log('📋 Primeiros usuários:', usuariosData?.slice(0, 3));
      }

      // Buscar aferições tradicionais - com logs detalhados
      console.log('📏 Buscando aferições tradicionais...');
      const { data: afericoesData, error: afericoesError } = await supabase
        .from('afericoes')
        .select('optica_id, id, usuario_id, nome_cliente, created_at');

      console.log('🔍 Resultado da query de aferições:', {
        data: afericoesData,
        error: afericoesError,
        count: afericoesData?.length || 0
      });

      if (afericoesError) {
        console.error('❌ Erro ao buscar aferições:', afericoesError);
        console.log('⚠️ Tentando buscar aferições com query mais simples...');
        
        // Tentar query mais simples para aferições
        const { data: afericoesSimple, error: afericoesSimpleError } = await supabase
          .from('afericoes')
          .select('*');
          
        if (afericoesSimpleError) {
          console.error('❌ Erro na query simples de aferições também:', afericoesSimpleError);
        } else {
          console.log('✅ Query simples de aferições funcionou:', afericoesSimple?.length || 0);
          console.log('📋 Primeiras aferições:', afericoesSimple?.slice(0, 3));
        }
      }

      // Buscar análises faciais - com logs detalhados
      console.log('🎭 Buscando análises faciais...');
      const { data: analisesData, error: analisesError } = await supabase
        .from('analises_faciais')
        .select('optica_id, id, usuario_id, nome_cliente, created_at');

      console.log('🔍 Resultado da query de análises:', {
        data: analisesData,
        error: analisesError,
        count: analisesData?.length || 0
      });

      if (analisesError) {
        console.error('❌ Erro ao buscar análises:', analisesError);
        console.log('⚠️ Tentando buscar análises com query mais simples...');
        
        // Tentar query mais simples para análises
        const { data: analisesSimple, error: analisesSimpleError } = await supabase
          .from('analises_faciais')
          .select('*');
          
        if (analisesSimpleError) {
          console.error('❌ Erro na query simples de análises também:', analisesSimpleError);
        } else {
          console.log('✅ Query simples de análises funcionou:', analisesSimple?.length || 0);
          console.log('📋 Primeiras análises:', analisesSimple?.slice(0, 3));
        }
      }

      // Processar dados de medições - usando os dados que conseguimos buscar
      const afericoesList = afericoesData || [];
      const analisesList = analisesData || [];
      const usuariosList = usuariosData || [];

      console.log('📈 Dados coletados:', {
        opticas: opticasData?.length || 0,
        usuarios: usuariosList.length,
        afericoesTradicionais: afericoesList.length,
        analisesFaciais: analisesList.length,
        totalMedicoes: afericoesList.length + analisesList.length
      });

      // Processar dados das óticas com contadores
      const opticasProcessed = opticasData?.map(optica => {
        // Contar usuários por ótica
        const users = usuariosList.filter(u => u.optica_id === optica.id).length;
        
        // Contar medições por ótica (aferições + análises)
        const afericoesCount = afericoesList.filter(a => a.optica_id === optica.id).length;
        const analisesCount = analisesList.filter(a => a.optica_id === optica.id).length;
        const measurements = afericoesCount + analisesCount;
        
        console.log(`🏪 Ótica ${optica.nome}: ${users} usuários, ${measurements} medições (${afericoesCount} aferições + ${analisesCount} análises)`);
        
        return {
          ...optica,
          users,
          measurements
        };
      }) || [];

      // Calcular estatísticas gerais
      const totalOpticas = opticasProcessed.length;
      const opticasAtivas = opticasProcessed.filter(o => o.ativo).length;
      const opticasBloqueadas = totalOpticas - opticasAtivas;
      const totalUsuarios = usuariosList.length;
      const totalMedicoes = afericoesList.length + analisesList.length;

      const newStats = {
        totalOpticas,
        opticasAtivas,
        opticasBloqueadas,
        totalUsuarios,
        totalAfericoes: totalMedicoes
      };

      console.log('📊 Estatísticas finais:', newStats);

      setOpticas(opticasProcessed);
      setStats(newStats);

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard: " + (error.message || 'Erro desconhecido'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOpticStatus = async (opticId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Alterando status da ótica:', opticId, 'para:', !currentStatus);
      
      const { error } = await supabase
        .from('opticas')
        .update({ ativo: !currentStatus })
        .eq('id', opticId);

      if (error) {
        console.error('❌ Erro ao alterar status:', error);
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: `Ótica ${!currentStatus ? 'ativada' : 'bloqueada'} com sucesso`,
      });

      // Recarregar dados
      await fetchDashboardData();

    } catch (error: any) {
      console.error('❌ Erro ao alterar status da ótica:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da ótica: " + (error.message || 'Erro desconhecido'),
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    opticas,
    stats,
    loading,
    fetchDashboardData,
    toggleOpticStatus
  };
};
