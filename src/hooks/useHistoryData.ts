
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Measurement {
  id: string;
  clientName: string;
  date: string;
  time: string;
  dp: string | null;
  dnpLeft: string | null;
  dnpRight: string | null;
  heightLeft: string | null;
  heightRight: string | null;
  frameWidth: string;
  type: 'aferição';
}

interface FacialAnalysis {
  id: string;
  clientName: string;
  date: string;
  time: string;
  frameStyle?: string;
  colors?: string[];
  confidence?: number;
  type: 'sugestão';
}

type HistoryRecord = Measurement | FacialAnalysis;

export const useHistoryData = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchHistoryData = async () => {
    if (!user?.opticId) {
      console.log('Usuário sem ótica associada');
      setLoading(false);
      return;
    }

    try {
      console.log('Buscando dados do histórico da ótica:', user.opticId);
      
      // Buscar aferições
      const { data: afericoes, error: afericoesError } = await supabase
        .from('afericoes')
        .select('*')
        .eq('optica_id', user.opticId)
        .order('created_at', { ascending: false });

      if (afericoesError) {
        console.error('Erro ao buscar aferições:', afericoesError);
        throw afericoesError;
      }

      // Buscar análises faciais
      const { data: analises, error: analisesError } = await supabase
        .from('analises_faciais')
        .select('*')
        .eq('optica_id', user.opticId)
        .order('created_at', { ascending: false });

      if (analisesError) {
        console.error('Erro ao buscar análises faciais:', analisesError);
        throw analisesError;
      }

      // Converter aferições para o formato esperado
      const measurementRecords: Measurement[] = (afericoes || []).map(afericao => {
        const createdAt = new Date(afericao.created_at);
        return {
          id: afericao.id,
          clientName: afericao.nome_cliente,
          date: createdAt.toISOString().split('T')[0], // YYYY-MM-DD
          time: createdAt.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          dp: afericao.dp_binocular?.toString() || null,
          dnpLeft: afericao.dnp_esquerda?.toString() || null,
          dnpRight: afericao.dnp_direita?.toString() || null,
          heightLeft: afericao.altura_esquerda?.toString() || null,
          heightRight: afericao.altura_direita?.toString() || null,
          frameWidth: afericao.largura_armacao?.toString() || '0',
          type: 'aferição' as const
        };
      });

      // Converter análises faciais para o formato esperado
      const analysisRecords: FacialAnalysis[] = (analises || []).map(analise => {
        const createdAt = new Date(analise.created_at);
        const sugestoes = analise.sugestoes as any;
        
        return {
          id: analise.id,
          clientName: analise.nome_cliente,
          date: createdAt.toISOString().split('T')[0],
          time: createdAt.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          frameStyle: sugestoes?.estilo || 'Sugestão de Armação',
          colors: sugestoes?.cores || ['Preto', 'Marrom'],
          confidence: sugestoes?.confianca || 85,
          type: 'sugestão' as const
        };
      });

      // Combinar e ordenar todos os registros por data
      const allRecords = [...measurementRecords, ...analysisRecords];
      allRecords.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
      });

      setRecords(allRecords);
      console.log('Dados carregados:', { 
        afericoes: measurementRecords.length, 
        analises: analysisRecords.length,
        total: allRecords.length 
      });

    } catch (error: any) {
      console.error('Erro ao carregar dados do histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de atendimentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, [user?.opticId]);

  return {
    records,
    loading,
    refetch: fetchHistoryData
  };
};
