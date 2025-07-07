
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();

    if (!imageData || !deepseekApiKey) {
      return new Response(
        JSON.stringify({ error: 'Dados insuficientes para análise' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Analisando presença de óculos com DeepSeek...');
    
    // Verificar se a imagem está no formato correto
    let processedImageData = imageData;
    if (!imageData.startsWith('data:image/')) {
      processedImageData = `data:image/jpeg;base64,${imageData}`;
    }
    
    // Limitar tamanho da imagem para evitar erro 422
    console.log('📏 Tamanho original da imagem:', processedImageData.length);
    
    const requestPayload = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em detecção de óculos. Analise a imagem e responda APENAS com JSON no formato: {"temOculos": true/false, "confiabilidade": 0.0-1.0, "detalhes": "descrição"}'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Esta pessoa está usando óculos? Responda apenas com JSON.'
            },
            {
              type: 'image_url',
              image_url: {
                url: processedImageData,
                detail: 'low' // Usar baixa resolução para evitar erro de tamanho
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.0,
      stream: false
    };

    console.log('📤 Enviando requisição para DeepSeek...');
    console.log('🔧 Modelo:', requestPayload.model);
    console.log('📊 Max tokens:', requestPayload.max_tokens);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      console.error('Erro na API DeepSeek:', response.status, await response.text());
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta completa do DeepSeek:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da API DeepSeek');
    }
    
    const content = data.choices[0].message.content;
    console.log('Conteúdo da resposta:', content);
    
    let analysis;
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: analisar texto para extrair informações
        const temOculos = content.toLowerCase().includes('true') || 
                         content.toLowerCase().includes('com óculos') ||
                         content.toLowerCase().includes('usando óculos');
        
        analysis = {
          temOculos: temOculos,
          confiabilidade: 0.7,
          detalhes: 'Análise baseada em texto: ' + content.substring(0, 100)
        };
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta:', parseError);
      console.log('Conteúdo que falhou:', content);
      
      // Fallback mais robusto
      const temOculos = content.toLowerCase().includes('óculos') && 
                       !content.toLowerCase().includes('sem óculos');
      
      analysis = {
        temOculos: temOculos,
        confiabilidade: 0.6,
        detalhes: 'Análise de fallback: ' + content.substring(0, 100)
      };
    }

    // Validar estrutura da resposta
    if (typeof analysis.temOculos !== 'boolean') {
      analysis.temOculos = false;
    }
    
    if (typeof analysis.confiabilidade !== 'number' || analysis.confiabilidade < 0 || analysis.confiabilidade > 1) {
      analysis.confiabilidade = 0.7;
    }
    
    if (!analysis.detalhes) {
      analysis.detalhes = 'Análise concluída';
    }

    console.log('✅ Análise de óculos concluída:', analysis);

    return new Response(
      JSON.stringify({ 
        temOculos: analysis.temOculos,
        confiabilidade: analysis.confiabilidade,
        detalhes: analysis.detalhes
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na detecção de óculos:', error);
    return new Response(
      JSON.stringify({ 
        temOculos: false,
        confiabilidade: 0.3,
        detalhes: 'Erro na análise: ' + error.message 
      }), 
      { 
        status: 200, // Retornar 200 para não quebrar o fluxo
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
