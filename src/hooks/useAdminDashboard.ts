
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
      
      // Buscar óticas com service role para bypass RLS
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

      // Buscar usuários com contagem por ótica
      console.log('👥 Buscando usuários...');
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios_optica')
        .select('optica_id, id, ativo')
        .eq('ativo', true);

      if (usuariosError) {
        console.error('❌ Erro ao buscar usuários:', usuariosError);
        // Não bloquear por erro de usuários, continuar sem eles
      }

      console.log('✅ Usuários encontrados:', usuariosData?.length || 0);

      // Buscar aferições tradicionais
      console.log('📏 Buscando aferições...');
      const { data: afericoesData, error: afericoesError } = await supabase
        .from('afericoes')
        .select('optica_id, id');

      if (afericoesError) {
        console.error('⚠️ Erro ao buscar aferições:', afericoesError);
      }

      // Buscar análises faciais
      console.log('🎭 Buscando análises faciais...');
      const { data: analisesData, error: analisesError } = await supabase
        .from('analises_faciais')
        .select('optica_id, id');

      if (analisesError) {
        console.error('⚠️ Erro ao buscar análises:', analisesError);
      }

      // Combinar dados de medições
      const totalAfericoes = [
        ...(afericoesData || []),
        ...(analisesData || [])
      ];

      console.log('📈 Dados coletados:', {
        opticas: opticasData?.length || 0,
        usuarios: usuariosData?.length || 0,
        afericoesTradicionais: afericoesData?.length || 0,
        analisesFaciais: analisesData?.length || 0,
        totalAfericoes: totalAfericoes.length
      });

      // Processar dados das óticas com contadores
      const opticasProcessed = opticasData?.map(optica => {
        const users = usuariosData?.filter(u => u.optica_id === optica.id).length || 0;
        const measurements = totalAfericoes.filter(a => a.optica_id === optica.id).length || 0;
        
        console.log(`🏪 Ótica ${optica.nome}: ${users} usuários, ${measurements} medições`);
        
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
      const totalUsuarios = usuariosData?.length || 0;
      const totalMedicoes = totalAfericoes.length;

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
