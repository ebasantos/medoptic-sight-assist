
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para redimensionar e comprimir imagem base64
function compressBase64Image(base64Data: string): string {
  try {
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const originalLength = base64String.length;
    const targetLength = Math.min(originalLength, 50000);
    
    if (originalLength > targetLength) {
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
    const { imageData } = await req.json();

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'imageData é obrigatório' }), 
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
    
    console.log('Analisando características faciais com DeepSeek Vision...');

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
            content: `Você é um especialista em análise facial para recomendação de óculos. Analise a imagem fornecida e determine as seguintes características da pessoa:

1. Formato do rosto: Identifique se é oval, redondo, quadrado, coração (triangular), losango ou retangular
2. Tom de pele: Classifique como claro, médio, escuro ou bronzeado
3. Distância entre os olhos: Determine se os olhos estão próximos, normais ou afastados

IMPORTANTE: 
- Seja preciso na análise das proporções faciais
- Considere a estrutura óssea e as linhas do rosto
- Observe atentamente a distância entre as pupilas em relação à largura dos olhos
- Base sua análise em características objetivas e mensuráveis

Retorne APENAS um JSON válido com as características:
{
  "formatoRosto": "string_formato_detectado",
  "tomPele": "string_tom_detectado", 
  "distanciaOlhos": "string_distancia_detectada",
  "confiabilidade": número_entre_0_e_1,
  "observacoes": "string_com_detalhes_da_analise"
}`
          },
          {
            role: 'user',
            content: `Analise esta foto para determinar as características faciais necessárias para recomendação de óculos.

Imagem: ${compressedImage}`
          }
        ],
        max_tokens: 500,
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
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
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

    // Validar campos obrigatórios
    if (!analysis.formatoRosto || !analysis.tomPele || !analysis.distanciaOlhos) {
      console.error('Características principais não detectadas:', analysis);
      return new Response(
        JSON.stringify({ error: 'IA não conseguiu detectar todas as características necessárias' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Garantir que os valores são válidos
    const validatedAnalysis = {
      formatoRosto: String(analysis.formatoRosto).toLowerCase(),
      tomPele: String(analysis.tomPele).toLowerCase(),
      distanciaOlhos: String(analysis.distanciaOlhos).toLowerCase(),
      confiabilidade: Number(analysis.confiabilidade) || 0.8,
      observacoes: analysis.observacoes || 'Características detectadas automaticamente'
    };

    console.log('Análise validada:', validatedAnalysis);

    return new Response(
      JSON.stringify({ analysis: validatedAnalysis }), 
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
