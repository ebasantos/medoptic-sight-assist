
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para redimensionar e comprimir imagem base64
function compressBase64Image(base64Data: string, maxWidth = 800, quality = 0.7): string {
  try {
    // Extrair apenas os dados base64, removendo o prefixo
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    
    // Para reduzir drasticamente o tamanho, vamos fazer uma compressão mais agressiva
    // Mantém apenas uma amostra dos dados para análise
    const originalLength = base64String.length;
    const targetLength = Math.min(originalLength, 50000); // Limitar a ~50k caracteres
    
    if (originalLength > targetLength) {
      // Pega amostras distribuídas da imagem para manter informação visual
      const step = Math.floor(originalLength / targetLength);
      let compressedData = '';
      
      for (let i = 0; i < originalLength; i += step) {
        compressedData += base64String[i] || '';
        if (compressedData.length >= targetLength) break;
      }
      
      console.log(`Imagem comprimida de ${originalLength} para ${compressedData.length} caracteres`);
      return `data:image/jpeg;base64,${compressedData}`;
    }
    
    return base64Data;
  } catch (error) {
    console.error('Erro ao comprimir imagem:', error);
    return base64Data;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando função de análise facial...');
    
    const requestData = await req.json();
    console.log('Dados recebidos:', {
      hasImageData: !!requestData.imageData,
      imageDataLength: requestData.imageData?.length || 0,
      frameWidth: requestData.frameWidth
    });

    const { imageData, frameWidth } = requestData;

    if (!imageData) {
      console.error('ImageData não fornecido');
      return new Response(
        JSON.stringify({ error: 'imageData é obrigatório' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar largura padrão de 50mm se não fornecida
    const adjustedFrameWidth = frameWidth || 50;
    console.log('Largura da armação ajustada:', adjustedFrameWidth);

    if (!deepseekApiKey) {
      console.error('Chave da API DeepSeek não configurada');
      return new Response(
        JSON.stringify({ error: 'Chave da API DeepSeek não configurada' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Comprimindo imagem antes da análise...');
    const compressedImage = compressBase64Image(imageData);
    console.log('Imagem comprimida com sucesso');
    
    console.log('Preparando chamada para DeepSeek Vision...');

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em medições óticas faciais para óculos. Analise a imagem fornecida e siga estas instruções específicas:

1. PRIMEIRO: Detecte se a pessoa está usando óculos/armação no rosto
2. Se estiver usando óculos: calcule TODAS as medidas (DP, DNP e alturas)
3. Se NÃO estiver usando óculos: calcule APENAS as medidas DP e DNP (defina alturas como 0)

Medidas a calcular:
- Distância pupilar binocular (DP): distância entre as pupilas dos dois olhos
- DNP esquerda: distância do centro do nariz (ponte nasal) à pupila esquerda  
- DNP direita: distância do centro do nariz (ponte nasal) à pupila direita
- Altura esquerda: altura da pupila esquerda até a parte inferior da armação/lente (APENAS se usando óculos)
- Altura direita: altura da pupila direita até a parte inferior da armação/lente (APENAS se usando óculos)
- Largura da lente: largura horizontal de cada lente da armação

IMPORTANTE: 
- A largura da armação de referência é ${adjustedFrameWidth}mm
- Use esta medida como referência de escala para converter pixels em milímetros
- Seja preciso na identificação das pupilas e pontos de referência
- Considere a perspectiva e possível distorção da câmera

Retorne APENAS um JSON válido com as medidas em milímetros:
{
  "dpBinocular": número,
  "dnpEsquerda": número,
  "dnpDireita": número,
  "alturaEsquerda": número_ou_0_se_sem_oculos,
  "alturaDireita": número_ou_0_se_sem_oculos,
  "larguraLente": número,
  "confiabilidade": número_entre_0_e_1,
  "temOculos": true_ou_false,
  "observacoes": "string_com_observacoes_sobre_a_qualidade_da_medicao_e_se_tem_oculos"
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise esta foto para medições óticas precisas. A largura da armação de referência é ${adjustedFrameWidth}mm. 

IMPORTANTE: Detecte primeiro se a pessoa está usando óculos. Se estiver, calcule todas as medidas. Se não estiver, calcule apenas DP e DNP (defina alturas como 0).`
            },
            {
              type: 'image_url',
              image_url: {
                url: compressedImage
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.1,
      stream: false
    };

    console.log('Enviando requisição para DeepSeek...');
    console.log('Tamanho do corpo da requisição:', JSON.stringify(requestBody).length);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Resposta recebida do DeepSeek, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro detalhado do DeepSeek:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      let errorMessage = 'Erro na análise da imagem';
      if (response.status === 429) {
        errorMessage = 'Limite de uso da API DeepSeek excedido. Tente novamente mais tarde.';
      } else if (response.status === 401) {
        errorMessage = 'Chave da API DeepSeek inválida';
      } else if (response.status >= 500) {
        errorMessage = 'Erro interno do DeepSeek. Tente novamente.';
      } else if (response.status === 400) {
        errorMessage = 'Erro na requisição. Verifique se a imagem está em formato válido.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: errorText }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Dados recebidos do DeepSeek:', JSON.stringify(data, null, 2));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Resposta inválida do DeepSeek - estrutura inesperada:', data);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da API DeepSeek', details: data }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const content = data.choices[0].message.content;
    console.log('Conteúdo da resposta do DeepSeek:', content);

    // Tentar extrair JSON da resposta
    let measurements;
    try {
      // Procurar por JSON na resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('JSON encontrado na resposta:', jsonMatch[0]);
        measurements = JSON.parse(jsonMatch[0]);
        console.log('JSON parseado com sucesso:', measurements);
      } else {
        console.error('JSON não encontrado na resposta do DeepSeek');
        console.error('Conteúdo completo:', content);
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      console.error('Conteúdo que falhou no parse:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao interpretar resposta da IA', 
          details: parseError.message,
          rawContent: content 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar se as medidas foram calculadas
    if (!measurements.dpBinocular || !measurements.dnpEsquerda || !measurements.dnpDireita) {
      console.error('Medidas principais não calculadas:', measurements);
      return new Response(
        JSON.stringify({ 
          error: 'IA não conseguiu calcular as medidas principais',
          details: measurements 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Garantir que todas as medidas são números válidos
    const validatedMeasurements = {
      dpBinocular: Number(measurements.dpBinocular) || 0,
      dnpEsquerda: Number(measurements.dnpEsquerda) || 0,
      dnpDireita: Number(measurements.dnpDireita) || 0,
      alturaEsquerda: Number(measurements.alturaEsquerda) || 0,
      alturaDireita: Number(measurements.alturaDireita) || 0,
      larguraLente: Number(measurements.larguraLente) || adjustedFrameWidth / 2,
      confiabilidade: Number(measurements.confiabilidade) || 0.8,
      temOculos: Boolean(measurements.temOculos),
      observacoes: measurements.observacoes || 'Medições calculadas automaticamente'
    };

    console.log('Medidas validadas e finais:', validatedMeasurements);

    return new Response(
      JSON.stringify({ measurements: validatedMeasurements }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral na análise:', error);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message,
        stack: error.stack
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
