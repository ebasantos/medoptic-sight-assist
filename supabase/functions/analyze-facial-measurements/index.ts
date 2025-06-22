
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Analisando imagem com OpenAI Vision...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
            content: [
              {
                type: 'text',
                text: `Analise esta foto para medições óticas precisas. A largura da armação é ${frameWidth}mm. Calcule todas as distâncias pupilares e alturas necessárias para a montagem de óculos.`
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
        max_tokens: 800,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da OpenAI:', errorText);
      throw new Error(`Erro da OpenAI: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Resposta da OpenAI:', content);

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
      throw new Error('Erro ao interpretar resposta da IA');
    }

    // Validar se as medidas foram calculadas
    if (!measurements.dpBinocular || !measurements.dnpEsquerda || !measurements.dnpDireita) {
      throw new Error('IA não conseguiu calcular as medidas principais');
    }

    return new Response(
      JSON.stringify({ measurements }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na análise:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao analisar imagem', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
