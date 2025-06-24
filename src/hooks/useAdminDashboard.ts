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

      // Buscar usuários com contagem por ótica - usando RPC ou query mais simples
      console.log('👥 Buscando usuários...');
      const { data: usuariosData, error: usuariosError } = await supabase
        .rpc('get_admin_users_count')
        .then(response => {
          if (response.error) {
            console.log('⚠️ RPC não disponível, usando query direta...');
            return supabase
              .from('usuarios_optica')
              .select('optica_id, id, ativo');
          }
          return response;
        });

      if (usuariosError) {
        console.error('❌ Erro ao buscar usuários:', usuariosError);
      }

      console.log('✅ Usuários encontrados:', usuariosData?.length || 0);

      // Buscar aferições tradicionais - usando query mais robusta
      console.log('📏 Buscando aferições tradicionais...');
      const { data: afericoesData, error: afericoesError } = await supabase
        .rpc('get_admin_afericoes_count')
        .then(response => {
          if (response.error) {
            console.log('⚠️ RPC não disponível, usando query direta para aferições...');
            return supabase
              .from('afericoes')
              .select('optica_id, id');
          }
          return response;
        });

      if (afericoesError) {
        console.error('⚠️ Erro ao buscar aferições:', afericoesError);
      }

      // Buscar análises faciais
      console.log('🎭 Buscando análises faciais...');
      const { data: analisesData, error: analisesError } = await supabase
        .rpc('get_admin_analises_count')
        .then(response => {
          if (response.error) {
            console.log('⚠️ RPC não disponível, usando query direta para análises...');
            return supabase
              .from('analises_faciais')
              .select('optica_id, id');
          }
          return response;
        });

      if (analisesError) {
        console.error('⚠️ Erro ao buscar análises:', analisesError);
      }

      // Processar dados de medições de forma mais robusta
      const afericoesList = Array.isArray(afericoesData) ? afericoesData : [];
      const analisesList = Array.isArray(analisesData) ? analisesData : [];
      const usuariosList = Array.isArray(usuariosData) ? usuariosData : [];

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
