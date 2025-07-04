
import { pipeline, env } from '@huggingface/transformers';

// Configurar transformers.js para sempre baixar modelos
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Iniciando processo de remoção de fundo...');
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // Converter HTMLImageElement para canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Não foi possível obter contexto do canvas');
    
    // Redimensionar imagem se necessário e desenhar no canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Imagem ${wasResized ? 'foi' : 'não foi'} redimensionada. Dimensões finais: ${canvas.width}x${canvas.height}`);
    
    // Obter dados da imagem como base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Imagem convertida para base64');
    
    // Processar a imagem com o modelo de segmentação
    console.log('Processando com modelo de segmentação...');
    const result = await segmenter(imageData);
    
    console.log('Resultado da segmentação:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Resultado de segmentação inválido');
    }
    
    // Criar novo canvas para a imagem mascarada
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Não foi possível obter contexto do canvas de saída');
    
    // Desenhar imagem original
    outputCtx.drawImage(canvas, 0, 0);
    
    // Aplicar a máscara
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Aplicar máscara invertida ao canal alpha
    for (let i = 0; i < result[0].mask.data.length; i++) {
      // Inverter o valor da máscara (1 - valor) para manter o objeto ao invés do fundo
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Máscara aplicada com sucesso');
    
    // Converter canvas para blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Blob final criado com sucesso');
            resolve(blob);
          } else {
            reject(new Error('Falha ao criar blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Erro ao remover fundo:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

// Função para centralizar e padronizar posicionamento da armação
export const normalizeGlassesPosition = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Encontrar bounds do objeto (área não transparente)
  let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
  let hasContent = false;
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = data[(y * canvas.width + x) * 4 + 3];
      if (alpha > 50) { // Pixel não transparente
        hasContent = true;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (!hasContent) return;
  
  // Calcular centro do objeto
  const objectCenterX = (minX + maxX) / 2;
  const objectCenterY = (minY + maxY) / 2;
  
  // Calcular centro do canvas
  const canvasCenterX = canvas.width / 2;
  const canvasCenterY = canvas.height / 2;
  
  // Calcular deslocamento necessário
  const offsetX = canvasCenterX - objectCenterX;
  const offsetY = canvasCenterY - objectCenterY;
  
  // Criar novo canvas para o resultado centralizado
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (tempCtx) {
    // Limpar canvas temporário
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Desenhar imagem centralizada
    tempCtx.putImageData(imageData, offsetX, offsetY);
    
    // Copiar resultado de volta para o canvas original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
};
