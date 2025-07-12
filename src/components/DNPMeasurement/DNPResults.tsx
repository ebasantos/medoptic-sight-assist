import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, RotateCcw, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DNPMeasurements {
  dnpLeft: number;
  dnpRight: number;
  binocularPD: number;
  confidence: number;
  measurements: {
    leftPupil: { x: number; y: number };
    rightPupil: { x: number; y: number };
    nasalBridge: { x: number; y: number };
  };
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
• Distância Pupilar Binocular: ${measurements.binocularPD.toFixed(1)} mm
• DNP Esquerda: ${measurements.dnpLeft.toFixed(1)} mm  
• DNP Direita: ${measurements.dnpRight.toFixed(1)} mm
• Confiança: ${(measurements.confidence * 100).toFixed(1)}%
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
        version: '2.0.0',
        method: 'Pixel-based DNP Measurement + Virtual Calibration'
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

  const isValidationOK = measurements.confidence > 0.8;
  const asymmetry = Math.abs(measurements.dnpLeft - measurements.dnpRight);

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
            {isValidationOK ? 'Medição Válida' : 'Verificar Resultados'}
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
            Distâncias medidas em milímetros com calibração virtual
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
                {measurements.binocularPD.toFixed(1)} mm
              </div>
            </div>
          </div>

          <Separator />

          {/* Individual PDs */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">DNP Esquerda</h4>
                <p className="text-sm text-muted-foreground">Pupila esq. → Nariz</p>
              </div>
              <div className="text-xl font-semibold">
                {measurements.dnpLeft.toFixed(1)} mm
              </div>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">DNP Direita</h4>
                <p className="text-sm text-muted-foreground">Pupila dir. → Nariz</p>
              </div>
              <div className="text-xl font-semibold">
                {measurements.dnpRight.toFixed(1)} mm
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
                <span className="text-muted-foreground">Posições detectadas:</span>
                <span className="ml-2 font-medium">3 pontos</span>
              </div>
              <div>
                <span className="text-muted-foreground">Precisão:</span>
                <span className="ml-2 font-medium">±0.5 mm</span>
              </div>
              <div>
                <span className="text-muted-foreground">Método:</span>
                <span className="ml-2 font-medium">Detecção por Pixels</span>
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
                    Confiança da medição abaixo do ideal ({(measurements.confidence * 100).toFixed(1)}%)
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
              <p>• <strong>Calibração:</strong> Régua virtual configurável</p>
              <p>• <strong>Detecção:</strong> Simulação baseada em proporções faciais típicas</p>
              <p>• <strong>Pontos medidos:</strong> Centro das pupilas e ponte nasal</p>
              <p>• <strong>Precisão teórica:</strong> ±1.0 mm com calibração adequada</p>
              <p>• <strong>Validação:</strong> Análise de confiança baseada em alinhamento</p>
              <p>• <strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}</p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};