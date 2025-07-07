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
  alturaEsquerda: number | null;
  alturaDireita: number | null;
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
      console.log('🚀 Iniciando análise facial ultra-precisa...');
      console.log('📊 Tamanho da imagem:', imageData.length);
      console.log('📏 Largura da armação:', frameWidth);
      
      const { data, error: supabaseError } = await supabase.functions.invoke('analyze-facial-measurements', {
        body: {
          imageData,
          frameWidth
        }
      });

      console.log('📥 Resposta da edge function ultra-precisa:', data);
      console.log('❌ Erro da edge function:', supabaseError);

      if (supabaseError) {
        console.error('💥 Erro detalhado do Supabase:', supabaseError);
        
        let errorMessage = 'Erro ao processar a análise ultra-precisa';
        
        if (supabaseError.message?.includes('Failed to send a request')) {
          errorMessage = 'Erro de conexão com o serviço de análise. Verifique sua conexão e tente novamente.';
        } else if (supabaseError.message?.includes('timeout')) {
          errorMessage = 'Timeout na análise. A imagem pode estar muito grande. Tente novamente.';
        } else if (supabaseError.message?.includes('unauthorized')) {
          errorMessage = 'Erro de autenticação. Faça login novamente.';
        }
        
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('🚨 Erro da função:', data.error);
        throw new Error(data.error);
      }

      if (!data?.measurements) {
        console.error('❌ Resposta inesperada:', data);
        throw new Error('Nenhuma medição ultra-precisa foi retornada');
      }

      console.log('✅ Análise ultra-precisa concluída com sucesso:', data.measurements);
      
      // Validar se as medições têm precisão adequada
      const precisionValidation = validateMeasurementPrecision(data.measurements);
      if (!precisionValidation.isValid) {
        console.warn('⚠️ Aviso de precisão:', precisionValidation.warnings);
      }
      
      setMeasurements(data.measurements);
      return data.measurements;

    } catch (err) {
      console.error('💥 Erro na análise facial ultra-precisa:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na análise ultra-precisa';
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

function validateMeasurementPrecision(measurements: MeasurementResult) {
  const warnings = [];
  
  // Verificar se DP está em faixa realista
  if (measurements.dpBinocular < 50 || measurements.dpBinocular > 75) {
    warnings.push(`DP Binocular fora da faixa normal: ${measurements.dpBinocular}mm`);
  }
  
  // Verificar se DNPs são equilibradas
  const dnpDifference = Math.abs(measurements.dnpEsquerda - measurements.dnpDireita);
  if (dnpDifference > 5) {
    warnings.push(`Diferença significativa entre DNPs: ${dnpDifference}mm`);
  }
  
  // Verificar confiabilidade
  if (measurements.confiabilidade < 0.8) {
    warnings.push(`Confiabilidade baixa: ${Math.round(measurements.confiabilidade * 100)}%`);
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}
