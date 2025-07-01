
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
  lensSimulations: number;
}

interface DashboardStats {
  totalOpticas: number;
  opticasAtivas: number;
  opticasBloqueadas: number;
  totalUsuarios: number;
  totalAfericoes: number;
  totalSimulacoes: number;
}

interface LensSimulationStats {
  totalSimulacoes: number;
  simulacoesHoje: number;
  simulacoesSemana: number;
  opticasMaisAtivas: Array<{
    nome: string;
    simulacoes: number;
  }>;
  tiposLentePopulares: Array<{
    tipo: string;
    quantidade: number;
  }>;
}

interface OpticUsageData {
  id: string;
  nome: string;
  totalSimulacoes: number;
  simulacoesHoje: number;
  simulacoesSemana: number;
  tiposLenteMaisUsados: Array<{
    tipo: string;
    quantidade: number;
  }>;
  usuariosAtivos: number;
  ultimaSimulacao?: string;
}

export const useAdminDashboard = () => {
  const [opticas, setOpticas] = useState<OpticData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOpticas: 0,
    opticasAtivas: 0,
    opticasBloqueadas: 0,
    totalUsuarios: 0,
    totalAfericoes: 0,
    totalSimulacoes: 0
  });
  const [lensSimulationStats, setLensSimulationStats] = useState<LensSimulationStats>({
    totalSimulacoes: 0,
    simulacoesHoje: 0,
    simulacoesSemana: 0,
    opticasMaisAtivas: [],
    tiposLentePopulares: []
  });
  const [opticUsageData, setOpticUsageData] = useState<OpticUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 Buscando dados do dashboard admin...');
      
      // Buscar óticas
      const { data: opticasData, error: opticasError } = await supabase
        .from('opticas')
        .select('*')
        .order('created_at', { ascending: false });

      if (opticasError) {
        console.error('❌ Erro ao buscar óticas:', opticasError);
        throw opticasError;
      }

      console.log('✅ Óticas encontradas:', opticasData?.length || 0);

      // Buscar usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios_optica')
        .select('optica_id, id, ativo, role, nome, email');

      if (usuariosError) {
        console.error('❌ Erro ao buscar usuários:', usuariosError);
      } else {
        console.log('✅ Usuários encontrados:', usuariosData?.length || 0);
      }

      // Buscar aferições tradicionais
      const { data: afericoesData, error: afericoesError } = await supabase
        .from('afericoes')
        .select('optica_id, id, usuario_id, nome_cliente, created_at');

      if (afericoesError) {
        console.error('❌ Erro ao buscar aferições:', afericoesError);
      } else {
        console.log('✅ Aferições encontradas:', afericoesData?.length || 0);
      }

      // Buscar análises faciais
      const { data: analisesData, error: analisesError } = await supabase
        .from('analises_faciais')
        .select('optica_id, id, usuario_id, nome_cliente, created_at');

      if (analisesError) {
        console.error('❌ Erro ao buscar análises:', analisesError);
      } else {
        console.log('✅ Análises encontradas:', analisesData?.length || 0);
      }

      // Buscar simulações de lentes
      const { data: simulacoesData, error: simulacoesError } = await supabase
        .from('simulacoes_lentes')
        .select('optica_id, id, nome_cliente, tipo_lente, created_at');

      if (simulacoesError) {
        console.error('❌ Erro ao buscar simulações:', simulacoesError);
      } else {
        console.log('✅ Simulações encontradas:', simulacoesData?.length || 0);
      }

      // Usar os dados que conseguimos buscar
      const afericoesList = afericoesData || [];
      const analisesList = analisesData || [];
      const usuariosList = usuariosData || [];
      const simulacoesList = simulacoesData || [];

      console.log('📈 Dados coletados:', {
        opticas: opticasData?.length || 0,
        usuarios: usuariosList.length,
        afericoesTradicionais: afericoesList.length,
        analisesFaciais: analisesList.length,
        simulacoesLentes: simulacoesList.length,
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

        // Contar simulações de lentes por ótica
        const lensSimulations = simulacoesList.filter(s => s.optica_id === optica.id).length;
        
        console.log(`🏪 Ótica ${optica.nome}: ${users} usuários, ${measurements} medições, ${lensSimulations} simulações`);
        
        return {
          ...optica,
          users,
          measurements,
          lensSimulations
        };
      }) || [];

      // Calcular estatísticas gerais
      const totalOpticas = opticasProcessed.length;
      const opticasAtivas = opticasProcessed.filter(o => o.ativo).length;
      const opticasBloqueadas = totalOpticas - opticasAtivas;
      const totalUsuarios = usuariosList.length;
      const totalMedicoes = afericoesList.length + analisesList.length;
      const totalSimulacoes = simulacoesList.length;

      const newStats = {
        totalOpticas,
        opticasAtivas,
        opticasBloqueadas,
        totalUsuarios,
        totalAfericoes: totalMedicoes,
        totalSimulacoes
      };

      // Calcular estatísticas específicas das simulações de lentes
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);

      const simulacoesHoje = simulacoesList.filter(s => {
        const dataSimulacao = new Date(s.created_at);
        dataSimulacao.setHours(0, 0, 0, 0);
        return dataSimulacao.getTime() === hoje.getTime();
      }).length;

      const simulacoesSemana = simulacoesList.filter(s => 
        new Date(s.created_at) >= semanaAtras
      ).length;

      // Óticas mais ativas em simulações
      const opticasSimulacoes = opticasProcessed
        .filter(o => o.lensSimulations > 0)
        .sort((a, b) => b.lensSimulations - a.lensSimulations)
        .slice(0, 5)
        .map(o => ({
          nome: o.nome,
          simulacoes: o.lensSimulations
        }));

      // Tipos de lente mais populares
      const tiposLenteCount = simulacoesList.reduce((acc, sim) => {
        acc[sim.tipo_lente] = (acc[sim.tipo_lente] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const tiposLentePopulares = Object.entries(tiposLenteCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tipo, quantidade]) => ({ tipo, quantidade }));

      const newLensStats = {
        totalSimulacoes,
        simulacoesHoje,
        simulacoesSemana,
        opticasMaisAtivas: opticasSimulacoes,
        tiposLentePopulares
      };

      // Processar dados detalhados por ótica
      const detailedOpticUsage: OpticUsageData[] = opticasProcessed.map(optica => {
        const opticaSimulacoes = simulacoesList.filter(s => s.optica_id === optica.id);
        
        // Simulações hoje
        const simulacoesHojeOptica = opticaSimulacoes.filter(s => {
          const dataSimulacao = new Date(s.created_at);
          dataSimulacao.setHours(0, 0, 0, 0);
          return dataSimulacao.getTime() === hoje.getTime();
        }).length;

        // Simulações na semana
        const simulacoesSemanaOptica = opticaSimulacoes.filter(s => 
          new Date(s.created_at) >= semanaAtras
        ).length;

        // Tipos de lente mais usados por ótica
        const tiposLenteOptica = opticaSimulacoes.reduce((acc, sim) => {
          acc[sim.tipo_lente] = (acc[sim.tipo_lente] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const tiposLenteMaisUsados = Object.entries(tiposLenteOptica)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([tipo, quantidade]) => ({ tipo, quantidade }));

        // Usuários ativos (que fizeram simulações)
        const usuariosQueSimularam = new Set(opticaSimulacoes.map(s => s.nome_cliente)).size;

        return {
          id: optica.id,
          nome: optica.nome,
          totalSimulacoes: optica.lensSimulations,
          simulacoesHoje: simulacoesHojeOptica,
          simulacoesSemana: simulacoesSemanaOptica,
          tiposLenteMaisUsados,
          usuariosAtivos: usuariosQueSimularam,
          ultimaSimulacao: opticaSimulacoes.length > 0 ? 
            opticaSimulacoes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at :
            undefined
        };
      });

      console.log('📊 Estatísticas finais:', newStats);
      console.log('👓 Estatísticas simulações:', newLensStats);
      console.log('🏪 Dados detalhados por ótica:', detailedOpticUsage);

      setOpticas(opticasProcessed);
      setStats(newStats);
      setLensSimulationStats(newLensStats);
      setOpticUsageData(detailedOpticUsage);

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
    lensSimulationStats,
    opticUsageData,
    loading,
    fetchDashboardData,
    toggleOpticStatus
  };
};
