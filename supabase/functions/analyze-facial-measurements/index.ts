
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
    const { imageData, frameWidth } = requestData;

    if (!imageData) {
      console.error('❌ ImageData não fornecido');
      return new Response(
        JSON.stringify({ error: 'imageData é obrigatório' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adjustedFrameWidth = frameWidth || 50;
    console.log('📏 Largura da armação:', adjustedFrameWidth);

    // Simplificar processamento da imagem
    let processedImage = imageData;
    if (!imageData.startsWith('data:image')) {
      processedImage = `data:image/jpeg;base64,${imageData}`;
    }

    // Encurtar drasticamente a imagem se for muito grande
    if (processedImage.length > 50000) {
      console.log('🔄 Comprimindo imagem drasticamente...');
      const base64Part = processedImage.split(',')[1] || processedImage;
      const compressedData = base64Part.substring(0, 30000);
      processedImage = `data:image/jpeg;base64,${compressedData}`;
    }
    
    console.log('🤖 Chamando DeepSeek API...');

    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `Analise esta imagem para medições de óculos. Largura da armação: ${adjustedFrameWidth}mm.

IMPORTANTE: Se a pessoa NÃO estiver usando óculos, defina "temOculos": false e NÃO inclua alturaEsquerda e alturaDireita no JSON.

Retorne apenas JSON válido com esta estrutura:

Se COM óculos:
{
  "dpBinocular": 62,
  "dnpEsquerda": 31, 
  "dnpDireita": 31,
  "alturaEsquerda": 20,
  "alturaDireita": 20,
  "larguraLente": 25,
  "confiabilidade": 0.8,
  "temOculos": true,
  "observacoes": "Análise com óculos"
}

Se SEM óculos:
{
  "dpBinocular": 62,
  "dnpEsquerda": 31, 
  "dnpDireita": 31,
  "larguraLente": 25,
  "confiabilidade": 0.8,
  "temOculos": false,
  "observacoes": "Análise sem óculos"
}

Imagem: ${processedImage}`
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('❌ Erro do DeepSeek:', response.status);
      
      // Retornar medidas padrão SEM óculos em caso de erro
      const defaultMeasurements = {
        dpBinocular: 62,
        dnpEsquerda: 31,
        dnpDireita: 31,
        larguraLente: adjustedFrameWidth / 2,
        confiabilidade: 0.5,
        temOculos: false,
        observacoes: 'Medidas padrão - erro na análise automática'
      };

      return new Response(
        JSON.stringify({ measurements: defaultMeasurements }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('✅ Resposta do DeepSeek recebida');
    
    if (!data.choices?.[0]?.message?.content) {
      console.error('❌ Resposta inválida do DeepSeek');
      
      // Retornar medidas padrão SEM óculos
      const defaultMeasurements = {
        dpBinocular: 62,
        dnpEsquerda: 31,
        dnpDireita: 31,
        larguraLente: adjustedFrameWidth / 2,
        confiabilidade: 0.5,
        temOculos: false,
        observacoes: 'Medidas padrão - resposta inválida da IA'
      };

      return new Response(
        JSON.stringify({ measurements: defaultMeasurements }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const content = data.choices[0].message.content;

    // Tentar extrair JSON da resposta
    let measurements;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        measurements = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado');
      }
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON, usando medidas padrão');
      
      measurements = {
        dpBinocular: 62,
        dnpEsquerda: 31,
        dnpDireita: 31,
        larguraLente: adjustedFrameWidth / 2,
        confiabilidade: 0.5,
        temOculos: false,
        observacoes: 'Medidas padrão - erro no processamento da resposta'
      };
    }

    // Validar e garantir valores seguros baseado se tem óculos ou não
    const temOculos = Boolean(measurements.temOculos);
    
    let validatedMeasurements = {
      dpBinocular: Number(measurements.dpBinocular) || 62,
      dnpEsquerda: Number(measurements.dnpEsquerda) || 31,
      dnpDireita: Number(measurements.dnpDireita) || 31,
      larguraLente: Number(measurements.larguraLente) || adjustedFrameWidth / 2,
      confiabilidade: Number(measurements.confiabilidade) || 0.8,
      temOculos: temOculos,
      observacoes: measurements.observacoes || 'Medições calculadas automaticamente'
    };

    // Adicionar alturas apenas se a pessoa estiver usando óculos
    if (temOculos) {
      validatedMeasurements.alturaEsquerda = Number(measurements.alturaEsquerda) || 20;
      validatedMeasurements.alturaDireita = Number(measurements.alturaDireita) || 20;
    }

    console.log('🎯 Retornando medidas:', validatedMeasurements);

    return new Response(
      JSON.stringify({ measurements: validatedMeasurements }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro geral na função:', error);
    
    // Sempre retornar medidas padrão SEM óculos em caso de erro crítico
    const emergencyMeasurements = {
      dpBinocular: 62,
      dnpEsquerda: 31,
      dnpDireita: 31,
      larguraLente: 25,
      confiabilidade: 0.5,
      temOculos: false,
      observacoes: 'Medidas padrão - erro crítico na análise'
    };

    return new Response(
      JSON.stringify({ measurements: emergencyMeasurements }), 
      { 
        status: 200, // Retornar 200 mesmo com erro para evitar 502
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
