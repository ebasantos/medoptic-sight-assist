
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FaceAnalysisResult {
  formatoRosto: string;
  tomPele: string;
  distanciaOlhos: string;
  confiabilidade: number;
  observacoes: string;
}

interface MeasurementResult {
  dpBinocular: number;
  dnpEsquerda: number;
  dnpDireita: number;
  alturaEsquerda: number;
  alturaDireita: number;
  larguraLente: number;
  confiabilidade: number;
  temOculos: boolean;
  observacoes: string;
}

export const useFacialMeasurements = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementResult | null>(null);
  const [faceAnalysis, setFaceAnalysis] = useState<FaceAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeFacialMeasurements = async (imageData: string, frameWidth: number) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando análise facial...');
      console.log('📊 Tamanho da imagem:', imageData.length);
      console.log('📏 Largura da armação:', frameWidth);
      
      const { data, error: supabaseError } = await supabase.functions.invoke('analyze-facial-measurements', {
        body: {
          imageData,
          frameWidth
        }
      });

      console.log('📥 Resposta da edge function:', data);
      console.log('❌ Erro da edge function:', supabaseError);

      if (supabaseError) {
        console.error('💥 Erro detalhado do Supabase:', supabaseError);
        
        // Melhorar tratamento de erros específicos
        let errorMessage = 'Erro ao processar a análise';
        
        if (supabaseError.message?.includes('Failed to send a request')) {
          errorMessage = 'Erro de conexão com o serviço de análise. Verifique sua conexão e tente novamente.';
        } else if (supabaseError.message?.includes('Failed to fetch')) {
          errorMessage = 'Erro de conectividade. Verifique sua conexão com a internet e tente novamente.';
        } else if (supabaseError.message?.includes('timeout')) {
          errorMessage = 'Timeout na análise. A imagem pode estar muito grande. Tente novamente.';
        } else if (supabaseError.message?.includes('unauthorized')) {
          errorMessage = 'Erro de autenticação. Faça login novamente.';
        }
        
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('🚨 Erro da função:', data.error);
        console.error('📋 Detalhes do erro:', data.details);
        throw new Error(data.error);
      }

      if (!data?.measurements) {
        console.error('❌ Resposta inesperada:', data);
        throw new Error('Nenhuma medição foi retornada');
      }

      console.log('✅ Análise concluída com sucesso:', data.measurements);
      setMeasurements(data.measurements);
      return data.measurements;

    } catch (err) {
      console.error('💥 Erro na análise facial:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFaceCharacteristics = async (imageData: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('🚀 Iniciando análise de características faciais...');
      
      const { data, error: supabaseError } = await supabase.functions.invoke('analyze-face-characteristics', {
        body: {
          imageData
        }
      });

      if (supabaseError) {
        console.error('❌ Erro do Supabase:', supabaseError);
        throw new Error('Erro ao processar a análise de características');
      }

      if (data?.error) {
        console.error('🚨 Erro da função:', data.error);
        throw new Error(data.error);
      }

      if (!data?.analysis) {
        throw new Error('Nenhuma análise foi retornada');
      }

      console.log('✅ Análise de características concluída:', data.analysis);
      setFaceAnalysis(data.analysis);
      return data.analysis;

    } catch (err) {
      console.error('💥 Erro na análise de características:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setMeasurements(null);
    setFaceAnalysis(null);
    setError(null);
  };

  return {
    isAnalyzing,
    measurements,
    faceAnalysis,
    error,
    analyzeFacialMeasurements,
    analyzeFaceCharacteristics,
    clearAnalysis
  };
};
