
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

    console.log('🔍 Analisando se a pessoa está usando óculos...');

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
            content: `Você é um especialista em análise visual de rostos. Analise a imagem e determine APENAS se a pessoa está usando óculos ou não.

IMPORTANTE: 
- Seja extremamente preciso na detecção
- Observe cuidadosamente se há armações, lentes, reflexos típicos de óculos
- Considere óculos de grau, de sol, ou qualquer tipo de óculos

Retorne APENAS um JSON válido:
{
  "temOculos": boolean,
  "confiabilidade": número_entre_0_e_1,
  "detalhes": "string_explicando_o_que_foi_observado"
}`
          },
          {
            role: 'user',
            content: `Analise esta foto e determine se a pessoa está usando óculos.

Imagem: ${imageData}`
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Erro ao parsear resposta:', parseError);
      return new Response(
        JSON.stringify({ error: 'Erro ao interpretar resposta da IA' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Análise de óculos concluída:', analysis);

    return new Response(
      JSON.stringify({ 
        temOculos: analysis.temOculos,
        confiabilidade: analysis.confiabilidade || 0.8,
        detalhes: analysis.detalhes || 'Análise visual concluída'
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na detecção de óculos:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno na detecção de óculos',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
