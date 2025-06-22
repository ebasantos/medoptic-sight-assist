
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface OpticStats {
  afericoesHoje: number;
  afericoesSemana: number;
  totalClientes: number;
  sugestoesGeradas: number;
}

interface RecentMeasurement {
  id: string;
  nome_cliente: string;
  created_at: string;
  dp_binocular: number | null;
}

export const useOpticDashboard = () => {
  const [stats, setStats] = useState<OpticStats>({
    afericoesHoje: 0,
    afericoesSemana: 0,
    totalClientes: 0,
    sugestoesGeradas: 0
  });
  const [recentMeasurements, setRecentMeasurements] = useState<RecentMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    if (!user?.opticId) {
      console.log('Usuário sem ótica associada');
      setLoading(false);
      return;
    }

    try {
      console.log('Buscando dados do dashboard da ótica:', user.opticId);
      
      // Data de hoje e início da semana
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      // Buscar aferições de hoje
      const { data: afericoesHoje, error: erroHoje } = await supabase
        .from('afericoes')
        .select('id')
        .eq('optica_id', user.opticId)
        .gte('created_at', inicioHoje.toISOString());

      if (erroHoje) {
        console.error('Erro ao buscar aferições de hoje:', erroHoje);
        throw erroHoje;
      }

      // Buscar aferições da semana
      const { data: afericoesSemana, error: erroSemana } = await supabase
        .from('afericoes')
        .select('id')
        .eq('optica_id', user.opticId)
        .gte('created_at', inicioSemana.toISOString());

      if (erroSemana) {
        console.error('Erro ao buscar aferições da semana:', erroSemana);
        throw erroSemana;
      }

      // Buscar total de clientes únicos
      const { data: clientesUnicos, error: erroClientes } = await supabase
        .from('afericoes')
        .select('nome_cliente')
        .eq('optica_id', user.opticId);

      if (erroClientes) {
        console.error('Erro ao buscar clientes:', erroClientes);
        throw erroClientes;
      }

      // Buscar sugestões geradas
      const { data: sugestoes, error: erroSugestoes } = await supabase
        .from('analises_faciais')
        .select('id')
        .eq('optica_id', user.opticId);

      if (erroSugestoes) {
        console.error('Erro ao buscar sugestões:', erroSugestoes);
        throw erroSugestoes;
      }

      // Buscar aferições recentes
      const { data: afericoesRecentes, error: erroRecentes } = await supabase
        .from('afericoes')
        .select('id, nome_cliente, created_at, dp_binocular')
        .eq('optica_id', user.opticId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (erroRecentes) {
        console.error('Erro ao buscar aferições recentes:', erroRecentes);
        throw erroRecentes;
      }

      // Processar dados
      const clientesSet = new Set(clientesUnicos?.map(c => c.nome_cliente.toLowerCase().trim()) || []);
      
      setStats({
        afericoesHoje: afericoesHoje?.length || 0,
        afericoesSemana: afericoesSemana?.length || 0,
        totalClientes: clientesSet.size,
        sugestoesGeradas: sugestoes?.length || 0
      });

      setRecentMeasurements(afericoesRecentes || []);

      console.log('Dados carregados:', {
        stats: {
          afericoesHoje: afericoesHoje?.length || 0,
          afericoesSemana: afericoesSemana?.length || 0,
          totalClientes: clientesSet.size,
          sugestoesGeradas: sugestoes?.length || 0
        },
        recentMeasurements: afericoesRecentes
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

  useEffect(() => {
    fetchDashboardData();
  }, [user?.opticId]);

  return {
    stats,
    recentMeasurements,
    loading,
    fetchDashboardData
  };
};
