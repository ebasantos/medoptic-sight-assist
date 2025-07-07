
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
            content: `Você é um especialista em detecção visual de óculos. Sua ÚNICA tarefa é determinar se a pessoa na imagem está usando óculos ou não.

CRITÉRIOS PARA DETECTAR ÓCULOS:
- Armações visíveis ao redor dos olhos (qualquer material: metal, plástico, acetato)
- Lentes com reflexos ou brilhos típicos
- Pontes nasais visíveis entre os olhos
- Hastes dos óculos visíveis nas laterais
- Qualquer tipo: óculos de grau, de sol, de leitura, etc.

IMPORTANTE:
- Analise CUIDADOSAMENTE a região dos olhos
- Não confunda sombras, maquiagem ou cabelo com óculos
- Se houver QUALQUER dúvida, seja conservador e marque como SEM óculos
- Seja extremamente preciso na análise

Responda APENAS com este JSON:
{
  "temOculos": true/false,
  "confiabilidade": 0.0-1.0,
  "detalhes": "descrição_detalhada_do_que_viu"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem e determine se a pessoa está usando óculos. Seja muito preciso na detecção.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
        stream: false
      }),
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
