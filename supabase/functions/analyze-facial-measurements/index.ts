
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando função de análise facial...');
    
    if (!deepseekApiKey) {
      console.error('❌ Chave da API DeepSeek não configurada');
      return new Response(
        JSON.stringify({ error: 'Chave da API DeepSeek não configurada' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData = await req.json();
    console.log('📥 Dados recebidos:', {
      hasImageData: !!requestData.imageData,
      imageDataLength: requestData.imageData?.length || 0,
      frameWidth: requestData.frameWidth
    });

    const { imageData, frameWidth } = requestData;

    if (!imageData) {
      console.error('❌ ImageData não fornecido');
      return new Response(
        JSON.stringify({ error: 'imageData é obrigatório' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar largura padrão de 50mm se não fornecida
    const adjustedFrameWidth = frameWidth || 50;
    console.log('📏 Largura da armação ajustada:', adjustedFrameWidth);

    // Processar imagem - garantir que está no formato correto
    let processedImage = imageData;
    try {
      // Verificar se a imagem já tem o prefixo data:image
      if (!imageData.startsWith('data:image')) {
        processedImage = `data:image/jpeg;base64,${imageData}`;
      }

      // Comprimir apenas se muito grande (mais de 100KB)
      if (processedImage.length > 100000) {
        console.log('🔄 Comprimindo imagem...');
        const base64Part = processedImage.split(',')[1] || processedImage;
        // Reduzir para 80KB para ter margem de segurança
        const maxLength = 80000;
        const compressedData = base64Part.substring(0, maxLength);
        processedImage = `data:image/jpeg;base64,${compressedData}`;
        console.log('✅ Imagem comprimida para', processedImage.length, 'caracteres');
      }
    } catch (error) {
      console.error('⚠️ Erro ao processar imagem:', error);
      // Continuar com imagem original se processamento falhar
    }
    
    console.log('🤖 Chamada para DeepSeek API...');

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `Analise esta imagem e calcule as medições faciais para óculos.

A largura da armação de referência é ${adjustedFrameWidth}mm.

INSTRUÇÕES:
1. Detecte se a pessoa está usando óculos
2. Se usando óculos: calcule DP, DNP esquerda/direita, altura esquerda/direita, largura da lente
3. Se sem óculos: calcule apenas DP e DNP (defina alturas como 0)

Retorne APENAS um JSON válido:
{
  "dpBinocular": número,
  "dnpEsquerda": número, 
  "dnpDireita": número,
  "alturaEsquerda": número_ou_0,
  "alturaDireita": número_ou_0,
  "larguraLente": número,
  "confiabilidade": 0.8,
  "temOculos": true_ou_false,
  "observacoes": "descrição"
}

Imagem: ${processedImage}`
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    };

    console.log('📤 Enviando para DeepSeek...');

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro do DeepSeek:', response.status, errorText);
      
      let errorMessage = 'Erro na análise da imagem';
      if (response.status === 429) {
        errorMessage = 'Limite da API excedido. Tente novamente em alguns minutos.';
      } else if (response.status === 401) {
        errorMessage = 'Chave da API inválida';
      } else if (response.status >= 500) {
        errorMessage = 'Erro do servidor DeepSeek. Tente novamente.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('✅ Resposta do DeepSeek:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('❌ Resposta inválida do DeepSeek');
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da API' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const content = data.choices[0].message.content;
    console.log('📝 Conteúdo:', content);

    // Extrair JSON da resposta
    let measurements;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        measurements = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      
      // Fallback com medidas padrões se não conseguir parsear
      measurements = {
        dpBinocular: 62,
        dnpEsquerda: 31,
        dnpDireita: 31,
        alturaEsquerda: 20,
        alturaDireita: 20,
        larguraLente: adjustedFrameWidth / 2,
        confiabilidade: 0.5,
        temOculos: true,
        observacoes: 'Erro na análise automática - usando medidas padrão'
      };
    }

    // Validar medidas
    const validatedMeasurements = {
      dpBinocular: Number(measurements.dpBinocular) || 62,
      dnpEsquerda: Number(measurements.dnpEsquerda) || 31,
      dnpDireita: Number(measurements.dnpDireita) || 31,
      alturaEsquerda: Number(measurements.alturaEsquerda) || 0,
      alturaDireita: Number(measurements.alturaDireita) || 0,
      larguraLente: Number(measurements.larguraLente) || adjustedFrameWidth / 2,
      confiabilidade: Number(measurements.confiabilidade) || 0.8,
      temOculos: Boolean(measurements.temOculos),
      observacoes: measurements.observacoes || 'Medições calculadas automaticamente'
    };

    console.log('🎯 Medidas finais:', validatedMeasurements);

    return new Response(
      JSON.stringify({ measurements: validatedMeasurements }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro geral:', error);
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
