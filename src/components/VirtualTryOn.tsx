
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, RotateCcw, Download, Glasses, Zap, Palette, Move, Upload } from 'lucide-react';
import { FaceDetection, FaceDetector } from './VirtualTryOn/FaceDetector';
import { GlassesRenderer } from './VirtualTryOn/GlassesRenderer';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type GlassesModel = Tables<'modelos_oculos'>;

interface VirtualTryOnProps {
  onCapture?: (imageData: string) => void;
  selectedModel?: GlassesModel | null;
  initialImage?: string | null; // Nova prop para imagem inicial
}

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ onCapture, selectedModel, initialImage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [currentFaceDetection, setCurrentFaceDetection] = useState<FaceDetection | null>(null);
  const [glassesModels, setGlassesModels] = useState<GlassesModel[]>([]);
  const [selectedGlasses, setSelectedGlasses] = useState<GlassesModel | null>(selectedModel || null);
  
  // Controles de ajuste
  const [glassesScale, setGlassesScale] = useState([1.0]);
  const [glassesRotation, setGlassesRotation] = useState([0]);
  const [glassesOpacity, setGlassesOpacity] = useState([0.9]);
  const [glassesPosition, setGlassesPosition] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState('#000000');
  
  const { toast } = useToast();

  // Usar imagem inicial se fornecida
  useEffect(() => {
    if (initialImage && !capturedImage) {
      setCapturedImage(initialImage);
      processImageForFaceDetection(initialImage);
    }
  }, [initialImage]);

  // Carregar modelos de óculos
  useEffect(() => {
    const loadGlassesModels = async () => {
      try {
        const { data, error } = await supabase
          .from('modelos_oculos')
          .select('*')
          .eq('ativo', true)
          .order('popular', { ascending: false });

        if (error) throw error;
        setGlassesModels(data || []);
        
        if (!selectedGlasses && data && data.length > 0) {
          setSelectedGlasses(data[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os modelos de óculos",
          variant: "destructive"
        });
      }
    };

    loadGlassesModels();
  }, [selectedGlasses, toast]);

  // Definir óculos selecionado quando prop muda
  useEffect(() => {
    if (selectedModel) {
      setSelectedGlasses(selectedModel);
    }
  }, [selectedModel]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        setCapturedImage(null);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast({
        title: "Erro de Câmera",
        description: "Não foi possível acessar sua câmera",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const processImageForFaceDetection = async (imageSrc: string): Promise<FaceDetection | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const detection = await FaceDetector.detectFaceFeatures(img);
          console.log('Detecção facial completa:', detection);
          setCurrentFaceDetection(detection);
          
          // Calcular escala automática baseada na detecção facial
          const faceMeasurements = {
            eyeDistancePixels: detection.eyeDistance,
            faceWidthPixels: detection.faceWidth,
            faceHeightPixels: detection.faceHeight,
            eyeLevel: detection.leftEye.y,
            centerX: (detection.leftEye.x + detection.rightEye.x) / 2,
            centerY: detection.leftEye.y
          };
          
          const calculatedScale = FaceDetector.calculateGlassesScale(faceMeasurements);
          setGlassesScale([calculatedScale]);
          
          resolve(detection);
        } catch (error) {
          console.error('Erro na detecção facial:', error);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    
    // Processar detecção facial na imagem capturada
    await processImageForFaceDetection(imageData);
    
    stopCamera();
    
    if (onCapture) {
      onCapture(imageData);
    }
    
    toast({
      title: "Foto Capturada!",
      description: "Agora você pode experimentar diferentes óculos"
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      stopCamera();
      
      // Processar detecção facial na imagem carregada
      await processImageForFaceDetection(imageData);
      
      if (onCapture) {
        onCapture(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  const renderGlassesOnCanvas = useCallback(async () => {
    if (!canvasRef.current || !capturedImage || !selectedGlasses) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Carregar e desenhar imagem de fundo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Renderizar óculos usando o GlassesRenderer
      const renderOptions = {
        position: glassesPosition,
        scale: glassesScale[0],
        rotation: glassesRotation[0],
        opacity: glassesOpacity[0],
        color: selectedColor
      };

      await GlassesRenderer.renderGlasses(
        ctx,
        selectedGlasses,
        renderOptions,
        canvas.width,
        canvas.height,
        currentFaceDetection || undefined
      );
    };
    img.src = capturedImage;
  }, [capturedImage, selectedGlasses, glassesScale, glassesRotation, glassesOpacity, glassesPosition, selectedColor, currentFaceDetection]);

  // Re-renderizar quando os controles mudarem
  useEffect(() => {
    if (capturedImage) {
      renderGlassesOnCanvas();
    }
  }, [renderGlassesOnCanvas, capturedImage]);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `oculos-virtual-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
    link.click();
    
    toast({
      title: "Download Concluído!",
      description: "Sua imagem foi salva com sucesso"
    });
  };

  const saveSimulation = () => {
    if (!canvasRef.current) return;
    
    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
    
    if (onCapture) {
      onCapture(imageData);
    }
    
    toast({
      title: "Simulação Salva!",
      description: "Imagem com óculos foi salva"
    });
  };

  const resetControls = () => {
    setGlassesScale([1.0]);
    setGlassesRotation([0]);
    setGlassesOpacity([0.9]);
    setGlassesPosition({ x: 0, y: 0 });
    setSelectedColor('#000000');
  };

  const getAvailableColors = () => {
    if (!selectedGlasses?.cores_disponiveis) return [];
    
    try {
      const colors = selectedGlasses.cores_disponiveis as any[];
      return Array.isArray(colors) ? colors : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Área da Câmera/Imagem */}
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            {!capturedImage ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            )}
            
            {currentFaceDetection && capturedImage && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-green-100 text-green-800">
                  <Zap className="w-3 h-3 mr-1" />
                  Face Detectada ({Math.round(currentFaceDetection.confidence * 100)}%)
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!capturedImage && (
              <>
                {!isStreaming && (
                  <Button onClick={startCamera} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Iniciar Câmera
                  </Button>
                )}
                
                {isStreaming && (
                  <Button onClick={capturePhoto} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Capturar Foto
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Carregar Foto
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </>
            )}
            
            {capturedImage && (
              <>
                <Button onClick={saveSimulation} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Salvar Simulação
                </Button>
                <Button onClick={downloadImage} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button onClick={() => setCapturedImage(null)} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Nova Foto
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="space-y-6">
          {/* Seleção de Modelo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Escolher Óculos</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedGlasses?.id || ''}
                onValueChange={(value) => {
                  const model = glassesModels.find(m => m.id === value);
                  setSelectedGlasses(model || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {glassesModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.nome} - {model.categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedGlasses && (
                <div className="mt-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedGlasses.imagem_url} 
                      alt={selectedGlasses.nome}
                      className="w-16 h-16 object-contain border rounded"
                    />
                    <div>
                      <h3 className="font-medium">{selectedGlasses.nome}</h3>
                      <p className="text-sm text-gray-600 capitalize">{selectedGlasses.categoria}</p>
                      {selectedGlasses.popular && (
                        <Badge variant="secondary" className="mt-1 text-xs">Popular</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controles de Ajuste */}
          {capturedImage && selectedGlasses && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Ajustar Óculos
                  <Button variant="outline" size="sm" onClick={resetControls}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tamanho */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tamanho: {glassesScale[0].toFixed(2)}x
                  </label>
                  <Slider
                    value={glassesScale}
                    onValueChange={setGlassesScale}
                    min={0.3}
                    max={2.5}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                {/* Rotação */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Rotação: {glassesRotation[0]}°
                  </label>
                  <Slider
                    value={glassesRotation}
                    onValueChange={setGlassesRotation}
                    min={-30}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Opacidade */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Opacidade: {Math.round(glassesOpacity[0] * 100)}%
                  </label>
                  <Slider
                    value={glassesOpacity}
                    onValueChange={setGlassesOpacity}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Posição */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Posição
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600">Horizontal</label>
                      <Slider
                        value={[glassesPosition.x]}
                        onValueChange={(value) => setGlassesPosition(prev => ({ ...prev, x: value[0] }))}
                        min={-20}
                        max={20}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Vertical</label>
                      <Slider
                        value={[glassesPosition.y]}
                        onValueChange={(value) => setGlassesPosition(prev => ({ ...prev, y: value[0] }))}
                        min={-20}
                        max={20}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Cores */}
                {getAvailableColors().length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Cor da Armação
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableColors().map((color: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedColor(color.codigo)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            selectedColor === color.codigo ? 'border-blue-500' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.codigo }}
                          title={color.nome}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações da Detecção */}
                {currentFaceDetection && (
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <h4 className="font-medium text-blue-900 mb-2">Análise Facial:</h4>
                    <div className="grid grid-cols-2 gap-2 text-blue-800">
                      <div>Distância dos olhos: {Math.round(currentFaceDetection.eyeDistance)}px</div>
                      <div>Largura do rosto: {Math.round(currentFaceDetection.faceWidth)}px</div>
                      <div>Altura do rosto: {Math.round(currentFaceDetection.faceHeight)}px</div>
                      <div>Confiança: {Math.round(currentFaceDetection.confidence * 100)}%</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
