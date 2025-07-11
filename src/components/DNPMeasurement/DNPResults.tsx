import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, RotateCcw, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DNPMeasurements {
  binocularPd: number;
  pdLeft: number;
  pdRight: number;
  confidence: number;
  samples: number;
  imageBase64?: string;
  validation: string;
}

interface Props {
  measurements: DNPMeasurements;
  onRestart: () => void;
  config?: any;
}

export const DNPResults: React.FC<Props> = ({ measurements, onRestart, config }) => {
  const { toast } = useToast();

  const copyResults = () => {
    const resultText = `
Medições DNP:
• Distância Pupilar Binocular: ${measurements.binocularPd} mm
• Distância Pupilar Esquerda: ${measurements.pdLeft} mm  
• Distância Pupilar Direita: ${measurements.pdRight} mm
• Confiança: ${(measurements.confidence * 100).toFixed(1)}%
• Validação: ${measurements.validation}
    `.trim();

    navigator.clipboard.writeText(resultText);
    toast({
      title: "Resultados copiados",
      description: "As medições foram copiadas para a área de transferência.",
    });
  };

  const downloadResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      measurements,
      metadata: {
        version: '1.0.0',
        method: 'MediaPipe FaceMesh + Card Calibration'
      }
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dnp-measurement-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Resultados baixados",
      description: "Arquivo JSON com as medições foi baixado.",
    });
  };

  const isValidationOK = measurements.validation === 'OK';
  const asymmetry = Math.abs(measurements.pdLeft - measurements.pdRight);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
          isValidationOK ? 'bg-success/10' : 'bg-warning/10'
        }`}>
          {isValidationOK ? (
            <CheckCircle className="w-8 h-8 text-success" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-warning" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Resultados da Medição DNP</h3>
          <Badge variant={isValidationOK ? 'default' : 'secondary'}>
            {measurements.validation}
          </Badge>
        </div>
      </div>

      {/* Main Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Medições Principais
            <Badge variant="outline">
              Confiança: {(measurements.confidence * 100).toFixed(1)}%
            </Badge>
          </CardTitle>
          <CardDescription>
            Distâncias medidas em milímetros com calibração por cartão de referência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Binocular PD */}
          <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
            <div>
              <h4 className="font-semibold text-lg">Distância Pupilar Binocular</h4>
              <p className="text-sm text-muted-foreground">Distância total entre as pupilas</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {measurements.binocularPd} mm
              </div>
            </div>
          </div>

          <Separator />

          {/* Individual PDs */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">DP Esquerda</h4>
                <p className="text-sm text-muted-foreground">Pupila esq. → Nariz</p>
              </div>
              <div className="text-xl font-semibold">
                {measurements.pdLeft} mm
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">DP Direita</h4>
                <p className="text-sm text-muted-foreground">Pupila dir. → Nariz</p>
              </div>
              <div className="text-xl font-semibold">
                {measurements.pdRight} mm
              </div>
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Análise dos Resultados</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Assimetria:</span>
                <span className={`ml-2 font-medium ${
                  asymmetry <= 1 ? 'text-success' : asymmetry <= 2 ? 'text-warning' : 'text-destructive'
                }`}>
                  {asymmetry.toFixed(1)} mm
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Amostras:</span>
                <span className="ml-2 font-medium">{measurements.samples}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Precisão:</span>
                <span className="ml-2 font-medium">±0.5 mm</span>
              </div>
              <div>
                <span className="text-muted-foreground">Método:</span>
                <span className="ml-2 font-medium">MediaPipe + Calibração</span>
              </div>
            </div>
          </div>

          {/* Validation Info */}
          {!isValidationOK && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Atenção</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {measurements.validation}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recomendamos repetir a medição para obter resultados mais precisos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={copyResults} variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          Copiar Resultados
        </Button>
        
        <Button onClick={downloadResults} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Baixar JSON
        </Button>
        
        <Button onClick={onRestart} variant="default">
          <RotateCcw className="w-4 h-4 mr-2" />
          Nova Medição
        </Button>
      </div>

      {/* Technical Info */}
      <Card>
        <CardContent className="pt-6">
          <details className="group">
            <summary className="cursor-pointer font-medium group-open:mb-4">
              Informações Técnicas
            </summary>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>Calibração:</strong> Cartão de referência padrão (86×54 mm)</p>
              <p>• <strong>Detecção:</strong> MediaPipe FaceMesh com 468 landmarks</p>
              <p>• <strong>Landmarks utilizados:</strong> Centro das pupilas (468, 473) e ponta do nariz (1)</p>
              <p>• <strong>Precisão teórica:</strong> ±0.5 mm com calibração adequada</p>
              <p>• <strong>Validação:</strong> Verificação de alinhamento horizontal das pupilas</p>
              <p>• <strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};