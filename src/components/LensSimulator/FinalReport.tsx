
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Share, 
  Mail, 
  MessageCircle, 
  Eye, 
  Star, 
  Check,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Calculator,
  ShieldCheck
} from 'lucide-react';

interface FinalReportProps {
  configuration: any;
  onRestart: () => void;
  onBack: () => void;
}

export const FinalReport: React.FC<FinalReportProps> = ({
  configuration,
  onRestart,
  onBack
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Dados simulados baseados na configuração
  const reportData = {
    client: {
      name: 'Cliente Simulação',
      date: new Date().toLocaleDateString('pt-BR'),
      age: configuration.lifestyleData?.age || '31-45',
      occupation: configuration.lifestyleData?.occupation || 'office'
    },
    configuration: {
      lens: configuration.selectedLens || 'progressiva',
      treatments: configuration.selectedTreatments || ['antireflexo', 'uv'],
      totalPrice: 850,
      installments: '12x R$ 70,83'
    },
    benefits: [
      'Visão nítida em todas as distâncias',
      'Redução de 90% nos reflexos',
      'Proteção total contra raios UV',
      'Diminuição da fadiga visual em 80%',
      'Melhora na qualidade do sono',
      'Adaptação natural e confortável'
    ],
    technicalSpecs: {
      'Tipo de Lente': 'Progressiva Premium',
      'Material': 'Policarbonato CR-39',
      'Índice de Refração': '1.59',
      'Tratamentos': 'Antirreflexo + UV + Hidrofóbico',
      'Garantia': '2 anos contra defeitos de fabricação'
    },
    aiScore: 94,
    lifestyle: configuration.lifestyleData?.lifestyle || 'moderate'
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    // Simulação de exportação
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    
    // Aqui seria integrado com jsPDF ou similar
    console.log('Exportando relatório PDF...');
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `🔍 *Relatório de Simulação de Lentes*\n\n` +
      `✨ Configuração Recomendada:\n` +
      `📱 Lente: ${reportData.configuration.lens}\n` +
      `🛡️ Tratamentos: ${reportData.configuration.treatments.join(', ')}\n` +
      `⭐ Score IA: ${reportData.aiScore}/100\n\n` +
      `💰 Investimento: R$ ${reportData.configuration.totalPrice}\n` +
      `💳 Ou ${reportData.configuration.installments}\n\n` +
      `Simule você também! 👓✨`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Relatório de Simulação de Lentes - Ótica Digital');
    const body = encodeURIComponent(
      `Olá!\n\nSegue o relatório da sua simulação de lentes com IA:\n\n` +
      `Configuração Recomendada:\n` +
      `- Lente: ${reportData.configuration.lens}\n` +
      `- Tratamentos: ${reportData.configuration.treatments.join(', ')}\n` +
      `- Score de Compatibilidade: ${reportData.aiScore}/100\n\n` +
      `Investimento: R$ ${reportData.configuration.totalPrice}\n` +
      `Parcelamento: ${reportData.configuration.installments}\n\n` +
      `Entre em contato para finalizar seu pedido!\n\n` +
      `Atenciosamente,\nEquipe Ótica Digital`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header do Relatório */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <FileText className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Relatório de Simulação Completo
        </h1>
        <p className="text-lg text-gray-600">
          Sua configuração personalizada com análise de IA
        </p>
        <Badge className="bg-green-600 text-white text-lg px-4 py-2 mt-4">
          <Star className="w-4 h-4 mr-2" />
          Score IA: {reportData.aiScore}/100
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Coluna Principal - Relatório */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumo Executivo */}
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-green-900">
                <Sparkles className="w-6 h-6" />
                <span>Resumo da Recomendação IA</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-green-900 mb-3">Sua Configuração Ideal:</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-green-700">Tipo de Lente:</span>
                      <Badge className="bg-green-600 text-white">{reportData.configuration.lens}</Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-green-700">Tratamentos:</span>
                      <div className="flex flex-wrap gap-1">
                        {reportData.configuration.treatments.map((treatment, index) => (
                          <Badge key={index} variant="outline" className="border-green-300 text-green-700 text-xs">
                            {treatment}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-3">Principais Benefícios:</h3>
                  <ul className="space-y-1">
                    {reportData.benefits.slice(0, 4).map((benefit, index) => (
                      <li key={index} className="flex items-start text-sm text-green-700">
                        <Check className="w-3 h-3 text-green-500 mr-2 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Especificações Técnicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Eye className="w-6 h-6 text-blue-600" />
                <span>Especificações Técnicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(reportData.technicalSpecs).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefícios Completos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
                <span>Todos os Benefícios</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {reportData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-blue-900 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Simulação Visual Final */}
          <Card>
            <CardHeader>
              <CardTitle>Simulação Visual Final</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h4 className="font-medium mb-3 text-gray-700">Sem Correção</h4>
                  <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 font-medium opacity-75">Visão Limitada</span>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="font-medium mb-3 text-green-700">Com Sua Configuração</h4>
                  <div className="h-32 bg-gradient-to-br from-green-200 to-emerald-300 rounded-lg flex items-center justify-center">
                    <span className="text-green-800 font-medium">Visão Otimizada ✨</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Informações e Ações */}
        <div className="space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">{reportData.client.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Faixa Etária:</span>
                <span className="font-medium">{reportData.client.age} anos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Perfil:</span>
                <span className="font-medium">{reportData.lifestyle}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-600">Score IA:</span>
                <Badge className="bg-green-600 text-white">{reportData.aiScore}/100</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Investimento */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900">
                <Calculator className="w-5 h-5" />
                <span>Investimento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div>
                  <div className="text-3xl font-bold text-blue-900">
                    R$ {reportData.configuration.totalPrice}
                  </div>
                  <div className="text-blue-700">à vista</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xl font-medium text-blue-800">
                    {reportData.configuration.installments}
                  </div>
                  <div className="text-sm text-blue-600">sem juros</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Compartilhamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share className="w-5 h-5" />
                <span>Compartilhar Relatório</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="mr-2 w-4 h-4" />
                {isExporting ? 'Gerando PDF...' : 'Baixar PDF'}
              </Button>
              
              <Button
                onClick={handleShareWhatsApp}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="mr-2 w-4 h-4" />
                Compartilhar no WhatsApp
              </Button>
              
              <Button
                onClick={handleShareEmail}
                variant="outline"
                className="w-full"
              >
                <Mail className="mr-2 w-4 h-4" />
                Enviar por Email
              </Button>
            </CardContent>
          </Card>

          {/* Próximos Passos */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900">Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                  <span>Agende uma consulta para confirmação do grau</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                  <span>Escolha a armação que melhor combina com você</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                  <span>Finalize o pedido com as especificações recomendadas</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botões de Ação Final */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex space-x-4">
          <Button variant="outline" onClick={onBack} className="px-6">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
          
          <Button variant="outline" onClick={onRestart} className="px-6">
            <RotateCcw className="mr-2 w-4 h-4" />
            Nova Simulação
          </Button>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
          Finalizar Pedido
          <Check className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
