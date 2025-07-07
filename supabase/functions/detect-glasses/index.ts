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
        JSON.stringify({ 
          temOculos: false,
          confiabilidade: 0.5,
          detalhes: 'Dados insuficientes' 
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Esta pessoa está usando óculos? Responda apenas: SIM ou NAO'
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
        max_tokens: 10,
        temperature: 0
      }),
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    const temOculos = content.toUpperCase().includes('SIM');
    
    return new Response(
      JSON.stringify({ 
        temOculos,
        confiabilidade: 0.8,
        detalhes: `Resposta: ${content}`
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        temOculos: false,
        confiabilidade: 0.3,
        detalhes: 'Erro na análise'
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});