import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Ruler, Info } from 'lucide-react';

interface CalibrationGuideProps {
  onCalibrationSet: (calibrationMM: number) => void;
}

export const CalibrationGuide: React.FC<CalibrationGuideProps> = ({ onCalibrationSet }) => {
  const referenceObjects = [
    { name: 'Cartão de Crédito', size: 85.6, description: 'Largura padrão ISO/IEC 7810' },
    { name: 'Moeda de R$ 1,00', size: 27, description: 'Diâmetro da moeda' },
    { name: 'Régua Padrão', size: 50, description: '5cm de uma régua comum' }
  ];

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Calibração para Medição Precisa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Instruções Importantes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Posicione um objeto de referência próximo ao seu rosto na foto</li>
                <li>• O objeto deve estar no mesmo plano focal que seus olhos</li>
                <li>• Mantenha a câmera perpendicular ao seu rosto</li>
                <li>• Evite inclinações ou ângulos que distorçam as medidas</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <h5 className="font-medium text-gray-700">Objetos de Referência Recomendados:</h5>
          {referenceObjects.map((obj) => (
            <div 
              key={obj.name}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onCalibrationSet(obj.size)}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{obj.name}</div>
                  <div className="text-sm text-gray-500">{obj.description}</div>
                </div>
              </div>
              <Badge variant="outline">{obj.size}mm</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};