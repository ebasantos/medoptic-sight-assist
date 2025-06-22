
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
      console.log('Buscando dados do dashboard admin...');
      
      // Buscar óticas
      const { data: opticasData, error: opticasError } = await supabase
        .from('opticas')
        .select('*')
        .order('created_at', { ascending: false });

      if (opticasError) {
        console.error('Erro ao buscar óticas:', opticasError);
        throw opticasError;
      }

      // Buscar contadores de usuários por ótica
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios_optica')
        .select('optica_id, id')
        .eq('ativo', true);

      if (usuariosError) {
        console.error('Erro ao buscar usuários:', usuariosError);
        throw usuariosError;
      }

      // Buscar TODAS as aferições (incluindo da tabela afericoes e analises_faciais)
      console.log('Buscando aferições...');
      const [afericoesResponse, analisesResponse] = await Promise.all([
        supabase.from('afericoes').select('optica_id, id'),
        supabase.from('analises_faciais').select('optica_id, id')
      ]);

      if (afericoesResponse.error) {
        console.error('Erro ao buscar aferições:', afericoesResponse.error);
        throw afericoesResponse.error;
      }

      if (analisesResponse.error) {
        console.error('Erro ao buscar análises faciais:', analisesResponse.error);
        throw analisesResponse.error;
      }

      const afericoesData = afericoesResponse.data || [];
      const analisesData = analisesResponse.data || [];
      
      // Combinar ambos os tipos de aferições
      const todasAfericoes = [...afericoesData, ...analisesData];

      console.log('Dados carregados:', { 
        opticasData: opticasData?.length, 
        usuariosData: usuariosData?.length, 
        afericoesData: afericoesData.length,
        analisesData: analisesData.length,
        totalAfericoes: todasAfericoes.length
      });

      // Processar dados das óticas com contadores
      const opticasProcessed = opticasData?.map(optica => {
        const users = usuariosData?.filter(u => u.optica_id === optica.id).length || 0;
        const measurements = todasAfericoes.filter(a => a.optica_id === optica.id).length || 0;
        
        return {
          ...optica,
          users,
          measurements
        };
      }) || [];

      // Calcular estatísticas
      const totalOpticas = opticasProcessed.length;
      const opticasAtivas = opticasProcessed.filter(o => o.ativo).length;
      const opticasBloqueadas = totalOpticas - opticasAtivas;
      const totalUsuarios = usuariosData?.length || 0;
      const totalAfericoes = todasAfericoes.length; // Soma de todas as aferições

      console.log('Estatísticas calculadas:', {
        totalOpticas,
        opticasAtivas,
        opticasBloqueadas,
        totalUsuarios,
        totalAfericoes
      });

      setOpticas(opticasProcessed);
      setStats({
        totalOpticas,
        opticasAtivas,
        opticasBloqueadas,
        totalUsuarios,
        totalAfericoes
      });

    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleOpticStatus = async (opticId: string, currentStatus: boolean) => {
    try {
      console.log('Alterando status da ótica:', opticId, 'para:', !currentStatus);
      
      const { error } = await supabase
        .from('opticas')
        .update({ ativo: !currentStatus })
        .eq('id', opticId);

      if (error) {
        console.error('Erro ao alterar status:', error);
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: `Ótica ${!currentStatus ? 'ativada' : 'bloqueada'} com sucesso`,
      });

      // Recarregar dados
      fetchDashboardData();

    } catch (error: any) {
      console.error('Erro ao alterar status da ótica:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da ótica",
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
