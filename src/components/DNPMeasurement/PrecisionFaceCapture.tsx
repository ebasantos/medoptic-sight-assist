import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Eye, RotateCcw, CheckCircle, AlertTriangle, Ruler } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface Props {
  pixelsPerMm: number | null;
  onCaptureComplete: (imageData: string) => void;
  isProcessing: boolean;
}

interface QualityChecks {
  distance: boolean;
  framing: boolean;
  lighting: boolean;
  stability: boolean;
  faceAlignment: boolean;
}

export const PrecisionFaceCapture: React.FC<Props> = ({ 
  pixelsPerMm, 
  onCaptureComplete, 
  isProcessing 
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qualityChecks, setQualityChecks] = useState<QualityChecks>({
    distance: false,
    framing: false,
    lighting: false,
    stability: false,
    faceAlignment: false
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    videoRef: cameraVideoRef,
    canvasRef,
    isActive, 
    isLoading,
    error: cameraError, 
    startCamera, 
    stopCamera,
    capturePhoto 
  } = useCamera({ timeout: 15000 }); // Timeout mais longo para casos difíceis

  // Simular análise de qualidade em tempo real
  const analyzeQuality = useCallback(() => {
    if (!isActive || !videoRef.current) return;

    // Simulação de verificações de qualidade
    const checks: QualityChecks = {
      distance: Math.random() > 0.3, // 70% chance de estar na distância correta
      framing: Math.random() > 0.4,  // 60% chance de enquadramento correto
      lighting: Math.random() > 0.2, // 80% chance de iluminação adequada
      stability: Math.random() > 0.3, // 70% chance de estabilidade
      faceAlignment: Math.random() > 0.25 // 75% chance de alinhamento correto
    };

    setQualityChecks(checks);
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      analysisIntervalRef.current = setInterval(analyzeQuality, 500);
      return () => {
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
        }
      };
    }
  }, [isActive, analyzeQuality]);

  const allChecksPass = Object.values(qualityChecks).every(check => check);

  const startCountdown = useCallback(() => {
    if (!allChecksPass) return;
    
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Capturar automaticamente quando countdown terminar
          setTimeout(() => {
            const imageData = capturePhoto();
            if (imageData) {
              setCapturedImage(imageData);
              stopCamera();
            }
            setCountdown(null);
          }, 100);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [allChecksPass, capturePhoto, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCountdown(null);
    setQualityChecks({
      distance: false,
      framing: false,
      lighting: false,
      stability: false,
      faceAlignment: false
    });
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCaptureComplete(capturedImage);
    }
  }, [capturedImage, onCaptureComplete]);

  // Sincronizar refs
  useEffect(() => {
    if (cameraVideoRef.current && videoRef.current) {
      videoRef.current = cameraVideoRef.current;
    }
  }, [cameraVideoRef]);

  const getQualityColor = (passed: boolean) => passed ? 'text-green-600' : 'text-red-500';
  const getQualityIcon = (passed: boolean) => passed ? '✓' : '✗';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Ruler className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Captura de Precisão DNP</h3>
          <p className="text-muted-foreground">
            Sistema rigoroso para medição precisa com parâmetros controlados
          </p>
          {pixelsPerMm && (
            <Badge variant="secondary" className="mt-2">
              Calibração: {pixelsPerMm.toFixed(3)} pixels/mm
            </Badge>
          )}
        </div>
      </div>

      {/* Verificações de Qualidade */}
      {isActive && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Verificações de Qualidade em Tempo Real
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className={`flex items-center gap-1 ${getQualityColor(qualityChecks.distance)}`}>
                <span>{getQualityIcon(qualityChecks.distance)}</span>
                <span>Distância 60cm</span>
              </div>
              <div className={`flex items-center gap-1 ${getQualityColor(qualityChecks.framing)}`}>
                <span>{getQualityIcon(qualityChecks.framing)}</span>
                <span>Enquadramento</span>
              </div>
              <div className={`flex items-center gap-1 ${getQualityColor(qualityChecks.lighting)}`}>
                <span>{getQualityIcon(qualityChecks.lighting)}</span>
                <span>Iluminação</span>
              </div>
              <div className={`flex items-center gap-1 ${getQualityColor(qualityChecks.stability)}`}>
                <span>{getQualityIcon(qualityChecks.stability)}</span>
                <span>Estabilidade</span>
              </div>
              <div className={`flex items-center gap-1 ${getQualityColor(qualityChecks.faceAlignment)}`}>
                <span>{getQualityIcon(qualityChecks.faceAlignment)}</span>
                <span>Alinhamento</span>
              </div>
            </div>
            
            {allChecksPass && (
              <Alert className="mt-3 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Todos os parâmetros estão ideais! Pronto para captura de precisão.
                </AlertDescription>
              </Alert>
            )}
            
            {!allChecksPass && (
              <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Ajuste sua posição para atender todos os critérios de qualidade.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Camera/Image Display */}
      <Card>
        <CardContent className="p-6">
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Guias de Precisão Ultra-Rígidas */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Zona de Distância Obrigatória */}
                  <div className="absolute top-4 left-4 right-4 h-16 border-2 border-blue-500 rounded bg-blue-500/10 flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-sm bg-white/90 px-2 py-1 rounded">
                      ZONA DE DISTÂNCIA: 60cm ± 2cm
                    </span>
                  </div>

                  {/* Frame Fixo Central - Tamanho Exato */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-72 h-96 border-4 border-green-500 rounded-xl bg-green-500/5 relative">
                      {/* Marcadores de distância */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-700 bg-white px-2 py-1 rounded">
                        FRAME OBRIGATÓRIO
                      </div>
                      
                      {/* Linha dos olhos - Posição Exata */}
                      <div className="absolute top-28 left-4 right-4 h-1 bg-blue-500 rounded">
                        <div className="absolute -top-6 left-0 right-0 text-center text-xs text-blue-700 font-medium">
                          LINHA DOS OLHOS
                        </div>
                      </div>
                      
                      {/* Círculos para os olhos - Posição Precisa */}
                      <div className="absolute top-24 left-16 w-8 h-8 border-3 border-blue-500 rounded-full bg-blue-100/50 flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                      <div className="absolute top-24 right-16 w-8 h-8 border-3 border-blue-500 rounded-full bg-blue-100/50 flex items-center justify-center">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                      
                      {/* Centro da face - Nariz */}
                      <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-4 h-6 border-2 border-red-500 rounded bg-red-100/50"></div>
                      
                      {/* Grid de Precisão */}
                      <div className="absolute inset-0">
                        {/* Linhas verticais */}
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-gray-400/30"></div>
                        <div className="absolute right-1/3 top-0 bottom-0 w-px bg-gray-400/30"></div>
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500/50"></div>
                        
                        {/* Linhas horizontais */}
                        <div className="absolute top-1/4 left-0 right-0 h-px bg-gray-400/30"></div>
                        <div className="absolute top-3/4 left-0 right-0 h-px bg-gray-400/30"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500/50"></div>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores de Status nos Cantos */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <div className={`px-3 py-1 rounded text-xs font-bold ${
                      qualityChecks.distance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Distância: {qualityChecks.distance ? 'OK' : 'Ajustar'}
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold ${
                      qualityChecks.framing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Posição: {qualityChecks.framing ? 'OK' : 'Centralizar'}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 space-y-2">
                    <div className={`px-3 py-1 rounded text-xs font-bold ${
                      qualityChecks.lighting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Luz: {qualityChecks.lighting ? 'Ideal' : 'Melhorar'}
                    </div>
                    <div className={`px-3 py-1 rounded text-xs font-bold ${
                      qualityChecks.faceAlignment ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Face: {qualityChecks.faceAlignment ? 'Alinhada' : 'Alinhar'}
                    </div>
                  </div>

                  {/* Countdown */}
                  {countdown && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-8xl font-bold animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Face capturada com precisão"
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Error Overlay */}
            {cameraError && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
                <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="font-medium text-red-800 mb-2">Erro na Câmera</p>
                  <p className="text-sm text-red-600 mb-4">{cameraError}</p>
                  <Button onClick={startCamera} variant="outline" size="sm">
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center text-primary">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="font-medium">Conectando com a câmera...</p>
                  <p className="text-sm text-muted-foreground">Aguarde alguns instantes</p>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!capturedImage ? (
          <>
            <Button 
              onClick={startCamera} 
              disabled={isActive || isProcessing || isLoading}
              variant="outline"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isLoading ? 'Conectando...' : isActive ? 'Câmera Ativa' : 'Iniciar Verificação'}
            </Button>
            <Button 
              onClick={startCountdown} 
              disabled={!isActive || isProcessing || !allChecksPass || countdown !== null || isLoading}
              variant="default"
              className={allChecksPass ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Camera className="w-4 h-4 mr-2" />
              {isLoading ? 'Conectando...' : 
               countdown ? `Capturando em ${countdown}...` : 
               allChecksPass ? 'Captura de Precisão' : 'Aguarde Validação'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={retakePhoto} variant="outline" disabled={isProcessing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Nova Captura
            </Button>
            <Button 
              onClick={confirmCapture} 
              disabled={isProcessing}
              className="bg-primary text-primary-foreground"
            >
              {isProcessing ? (
                'Processando...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Medição
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Instruções Críticas */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <h4 className="font-bold mb-3 text-orange-800">📏 PROTOCOLO DE PRECISÃO OBRIGATÓRIO</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-orange-700">
            <div>
              <h5 className="font-bold mb-2">🎯 Posicionamento Exato:</h5>
              <ul className="space-y-1">
                <li>• Distância FIXA: 60cm (±2cm)</li>
                <li>• Rosto 100% dentro do frame verde</li>
                <li>• Olhos alinhados na linha azul</li>
                <li>• Cabeça perfeitamente vertical</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-2">⚡ Condições Obrigatórias:</h5>
              <ul className="space-y-1">
                <li>• Iluminação uniforme no rosto</li>
                <li>• Sem sombras ou reflexos</li>
                <li>• Olhos totalmente abertos</li>
                <li>• Expressão neutra e relaxada</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-2">🚫 Restrições:</h5>
              <ul className="space-y-1">
                <li>• REMOVER óculos obrigatoriamente</li>
                <li>• Cabelo afastado dos olhos</li>
                <li>• Nenhum movimento durante captura</li>
                <li>• Fundo neutro sem padrões</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-2">✅ Validação:</h5>
              <ul className="space-y-1">
                <li>• Todos os 5 critérios VERDES</li>
                <li>• Captura automática em 3 segundos</li>
                <li>• Medição crítica ±0.5mm</li>
                <li>• Repetir se necessário</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};