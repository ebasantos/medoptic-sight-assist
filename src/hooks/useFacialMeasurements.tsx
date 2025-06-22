
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MeasurementResult {
  dpBinocular: number;
  dnpEsquerda: number;
  dnpDireita: number;
  alturaEsquerda: number;
  alturaDireita: number;
  larguraLente: number;
  confiabilidade: number;
  observacoes: string;
}

export const useFacialMeasurements = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFacialMeasurements = async (imageData: string, frameWidth: number) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Iniciando análise facial...');
      
      const { data, error: supabaseError } = await supabase.functions.invoke('analyze-facial-measurements', {
        body: {
          imageData,
          frameWidth
        }
      });

      if (supabaseError) {
        console.error('Erro do Supabase:', supabaseError);
        let errorMessage = 'Erro ao processar a análise';
        
        if (supabaseError.message?.includes('non-2xx status code')) {
          errorMessage = 'Erro na comunicação com o serviço de análise. Tente novamente.';
        }
        
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('Erro da função:', data.error);
        throw new Error(data.error);
      }

      if (!data?.measurements) {
        throw new Error('Nenhuma medição foi retornada');
      }

      console.log('Análise concluída:', data.measurements);
      setMeasurements(data.measurements);
      return data.measurements;

    } catch (err) {
      console.error('Erro na análise facial:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearMeasurements = () => {
    setMeasurements(null);
    setError(null);
  };

  return {
    isAnalyzing,
    measurements,
    error,
    analyzeFacialMeasurements,
    clearMeasurements
  };
};
