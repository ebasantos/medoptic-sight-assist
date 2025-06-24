
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

      // Usar os dados que conseguimos buscar
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
