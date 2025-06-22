
import React from 'react';
import { Brain, Camera } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FaceAnalysisLoaderProps {
  progress: number;
  stage: 'capturing' | 'compressing' | 'analyzing' | 'processing';
}

const FaceAnalysisLoader: React.FC<FaceAnalysisLoaderProps> = ({ progress, stage }) => {
  const getStageMessage = () => {
    switch (stage) {
      case 'capturing':
        return 'Capturando imagem...';
      case 'compressing':
        return 'Otimizando imagem para análise...';
      case 'analyzing':
        return 'Analisando características faciais...';
      case 'processing':
        return 'Processando resultados...';
      default:
        return 'Processando...';
    }
  };

  const getIcon = () => {
    switch (stage) {
      case 'capturing':
        return <Camera className="h-8 w-8 text-blue-600" />;
      case 'compressing':
      case 'processing':
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>;
      case 'analyzing':
        return <Brain className="h-8 w-8 text-purple-600" />;
      default:
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        {getIcon()}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Análise Facial em Andamento
      </h3>
      
      <p className="text-gray-600 mb-6 text-center">
        {getStageMessage()}
      </p>
      
      <div className="w-full max-w-xs">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-500 mt-2 text-center">
          {Math.round(progress)}% concluído
        </p>
      </div>
      
      <div className="mt-4 text-xs text-gray-400 text-center">
        <p>⚡ Usando IA avançada para detectar:</p>
        <p>• Formato do rosto • Tom de pele • Distância dos olhos</p>
      </div>
    </div>
  );
};

export default FaceAnalysisLoader;
