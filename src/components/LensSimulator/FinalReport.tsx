import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Star, 
  Eye, 
  Shield, 
  Sparkles,
  Check,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Importação dinâmica do jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      
      // Configurações gerais
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 20;

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO DE SIMULAÇÃO DE LENTES', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Análise Personalizada com IA', pageWidth / 2, yPosition, { align: 'center' });
      
      // Linha separadora
      yPosition += 15;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      
      // Dados do cliente
      yPosition += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO CLIENTE', margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${configuration.clientName || 'Não informado'}`, margin, yPosition);
      
      yPosition += 8;
      if (configuration.lifestyleData?.idade) {
        doc.text(`Idade: ${configuration.lifestyleData.idade}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (configuration.lifestyleData?.profissao) {
        doc.text(`Profissão: ${configuration.lifestyleData.profissao}`, margin, yPosition);
        yPosition += 8;
      }
      
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
      
      // Configuração recomendada
      yPosition += 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CONFIGURAÇÃO RECOMENDADA', margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo de Lente: ${configuration.selectedLens || 'Não selecionado'}`, margin, yPosition);
      
      yPosition += 8;
      if (configuration.selectedTreatments?.length > 0) {
        doc.text('Tratamentos:', margin, yPosition);
        yPosition += 6;
        configuration.selectedTreatments.forEach((treatment: string) => {
          doc.text(`• ${treatment}`, margin + 10, yPosition);
          yPosition += 6;
        });
      }
      
      // Recomendações da IA
      if (configuration.aiRecommendations?.motivos?.length > 0) {
        yPosition += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('JUSTIFICATIVAS DA IA', margin, yPosition);
        
        yPosition += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        configuration.aiRecommendations.motivos.forEach((motivo: string) => {
          doc.text(`• ${motivo}`, margin, yPosition);
          yPosition += 8;
        });
      }
      
      // Rodapé
      const footerY = doc.internal.pageSize.height - 30;
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Relatório gerado automaticamente pelo Simulador de Lentes IA', pageWidth / 2, footerY + 10, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerY + 18, { align: 'center' });
      
      // Abrir em nova aba
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.print();
        };
      }
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Dados para exibição
  const clientData = {
    nome: configuration.clientName || 'Cliente',
    idade: configuration.lifestyleData?.idade || 'Não informado',
    profissao: configuration.lifestyleData?.profissao || 'Não informado',
    tempoTela: configuration.lifestyleData?.tempoTela || 'Não informado'
  };

  const recommendations = {
    lente: configuration.selectedLens || 'Não selecionado',
    tratamentos: configuration.selectedTreatments || [],
    score: configuration.aiRecommendations?.score || 85,
    motivos: configuration.aiRecommendations?.motivos || []
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header fixo */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b px-4 py-4 flex-shrink-0">
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-lg font-bold text-green-900 mb-1">
              Simulação Concluída!
            </h1>
            <p className="text-sm text-green-700">
              Sua configuração personalizada está pronta
            </p>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-4 space-y-4 pb-32">
            {/* Resumo do Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Eye className="w-4 h-4 text-blue-600 mr-2" />
                  Resumo do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Nome:</span>
                    <span className="text-gray-900">{clientData.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Idade:</span>
                    <span className="text-gray-900">{clientData.idade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Profissão:</span>
                    <span className="text-gray-900">{clientData.profissao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Tempo Tela:</span>
                    <span className="text-gray-900">{clientData.tempoTela}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuração Recomendada */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-green-600 mr-2" />
                    Configuração Final
                  </div>
                  <Badge className="bg-green-600 text-white text-xs">
                    Score: {recommendations.score}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700 text-sm">Tipo de Lente:</span>
                  <p className="text-base font-semibold text-green-800 capitalize mt-1">
                    {recommendations.lente}
                  </p>
                </div>
                
                {recommendations.tratamentos.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-2 text-sm">Tratamentos:</span>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.tratamentos.map((treatment: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-green-300 text-green-700 text-xs">
                          {treatment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {recommendations.motivos.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-2 text-sm">Justificativas da IA:</span>
                    <ul className="space-y-2">
                      {recommendations.motivos.map((motivo: string, index: number) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <Check className="w-3 h-3 text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span>{motivo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer fixo */}
        <div className="bg-white border-t px-4 py-4 space-y-3 flex-shrink-0">
          <Button 
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGeneratingPDF ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar Relatório PDF
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              onClick={onRestart}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Nova Simulação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <Star className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Simulação Concluída!
        </h2>
        <p className="text-xl text-gray-600">
          Sua configuração personalizada de lentes está pronta
        </p>
        <Badge className="mt-4 bg-green-50 text-green-700 px-6 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          Análise IA Finalizada
        </Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Resumo do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <span>Resumo do Cliente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">Nome:</span>
                <p className="text-lg font-semibold">{clientData.nome}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Idade:</span>
                <p className="text-lg">{clientData.idade}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Profissão:</span>
                <p className="text-lg">{clientData.profissao}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Tempo em Telas:</span>
                <p className="text-lg">{clientData.tempoTela}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuração Final */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-green-600" />
                <span className="text-green-900">Configuração Final</span>
              </div>
              <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                Score: {recommendations.score}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <span className="font-medium text-gray-700">Tipo de Lente:</span>
              <p className="text-2xl font-bold text-green-800 capitalize">
                {recommendations.lente}
              </p>
            </div>
            
            {recommendations.tratamentos.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 block mb-3">Tratamentos Aplicados:</span>
                <div className="flex flex-wrap gap-3">
                  {recommendations.tratamentos.map((treatment: string, index: number) => (
                    <Badge key={index} className="bg-green-100 text-green-700 border border-green-300 px-3 py-1">
                      {treatment}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {recommendations.motivos.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 block mb-3">Justificativas da IA:</span>
                <ul className="space-y-2">
                  {recommendations.motivos.map((motivo: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <span className="text-gray-700">{motivo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={onBack}
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex space-x-4">
          <Button 
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGeneratingPDF ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Baixar Relatório PDF
              </>
            )}
          </Button>
          
          <Button 
            onClick={onRestart}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Nova Simulação
          </Button>
        </div>
      </div>
    </div>
  );
};
