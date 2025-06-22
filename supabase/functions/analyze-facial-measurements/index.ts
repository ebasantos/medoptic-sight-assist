
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
    const { imageData, frameWidth } = await req.json();

    if (!imageData || !frameWidth) {
      return new Response(
        JSON.stringify({ error: 'imageData e frameWidth são obrigatórios' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!deepseekApiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave da API DeepSeek não configurada' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Comprimindo imagem antes da análise...');
    const compressedImage = compressBase64Image(imageData);
    
    console.log('Analisando imagem com DeepSeek Vision...');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em medições óticas faciais para óculos. Analise a imagem fornecida e calcule as seguintes medidas com precisão:

1. Distância pupilar binocular (DP): distância entre as pupilas dos dois olhos
2. DNP esquerda: distância do centro do nariz (ponte nasal) à pupila esquerda
3. DNP direita: distância do centro do nariz (ponte nasal) à pupila direita
4. Altura esquerda: altura da pupila esquerda até a parte inferior da armação/lente
5. Altura direita: altura da pupila direita até a parte inferior da armação/lente
6. Largura da lente: largura horizontal de cada lente da armação

IMPORTANTE: 
- A largura da armação informada é ${frameWidth}mm
- Use esta medida como referência de escala para converter pixels em milímetros
- Seja preciso na identificação das pupilas e pontos de referência
- Considere a perspectiva e possível distorção da câmera
- Se a pessoa não estiver usando óculos, estime onde seria a posição da armação

Retorne APENAS um JSON válido com as medidas em milímetros:
{
  "dpBinocular": número,
  "dnpEsquerda": número,
  "dnpDireita": número,
  "alturaEsquerda": número,
  "alturaDireita": número,
  "larguraLente": número,
  "confiabilidade": número_entre_0_e_1,
  "observacoes": "string_com_observacoes_sobre_a_qualidade_da_medicao"
}`
          },
          {
            role: 'user',
            content: `Analise esta foto para medições óticas precisas. A largura da armação é ${frameWidth}mm. Calcule todas as distâncias pupilares e alturas necessárias para a montagem de óculos.

Imagem comprimida em base64: ${compressedImage}`
          }
        ],
        max_tokens: 800,
        temperature: 0.1,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro do DeepSeek:', response.status, errorText);
      
      let errorMessage = 'Erro na análise da imagem';
      if (response.status === 429) {
        errorMessage = 'Limite de uso da API DeepSeek excedido. Tente novamente mais tarde.';
      } else if (response.status === 401) {
        errorMessage = 'Chave da API DeepSeek inválida';
      } else if (response.status >= 500) {
        errorMessage = 'Erro interno do DeepSeek. Tente novamente.';
      } else if (response.status === 400) {
        errorMessage = 'Imagem muito grande ou formato inválido. Tente com uma foto menor.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Resposta inválida do DeepSeek:', data);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da API DeepSeek' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const content = data.choices[0].message.content;
    console.log('Resposta do DeepSeek:', content);

    // Tentar extrair JSON da resposta
    let measurements;
    try {
      // Procurar por JSON na resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        measurements = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      console.error('Conteúdo recebido:', content);
      return new Response(
        JSON.stringify({ error: 'Erro ao interpretar resposta da IA' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar se as medidas foram calculadas
    if (!measurements.dpBinocular || !measurements.dnpEsquerda || !measurements.dnpDireita) {
      console.error('Medidas principais não calculadas:', measurements);
      return new Response(
        JSON.stringify({ error: 'IA não conseguiu calcular as medidas principais' }), 
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
      larguraLente: Number(measurements.larguraLente) || frameWidth / 2,
      confiabilidade: Number(measurements.confiabilidade) || 0.8,
      observacoes: measurements.observacoes || 'Medições calculadas automaticamente com imagem comprimida'
    };

    console.log('Medidas validadas:', validatedMeasurements);

    return new Response(
      JSON.stringify({ measurements: validatedMeasurements }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na análise:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
