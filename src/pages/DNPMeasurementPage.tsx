import React from 'react';
import { DNPMeasurementScreen } from '@/components/DNPMeasurement/DNPMeasurementScreen';

const DNPMeasurementPage: React.FC = () => {
  const handleComplete = (result: any) => {
    console.log('Medição concluída:', result);
  };

  const handleError = (error: any) => {
    console.error('Erro na medição:', error);
  };

  return (
    <div className="min-h-screen bg-background">
      <DNPMeasurementScreen 
        config={{
          language: 'pt-BR',
          onComplete: handleComplete,
          onError: handleError
        }}
      />
    </div>
  );
};

export default DNPMeasurementPage;