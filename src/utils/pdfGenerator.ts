
import jsPDF from 'jspdf';

interface MeasurementData {
  clientName: string;
  date: string;
  time: string;
  dp: string | null;
  dnpLeft: string | null;
  dnpRight: string | null;
  heightLeft: string | null;
  heightRight: string | null;
  frameWidth: string;
}

export const generateTechnicalSheet = (measurement: MeasurementData) => {
  const doc = new jsPDF();
  
  // Configurações gerais
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 20;
  
  // Cabeçalho do sistema
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('PUPILÔMETRO', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('por EBS Tecnologia', pageWidth / 2, yPosition, { align: 'center' });
  
  // Linha separadora
  yPosition += 15;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  // Título da ficha
  yPosition += 15;
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('FICHA TÉCNICA DE AFERIÇÃO', pageWidth / 2, yPosition, { align: 'center' });
  
  // Dados do cliente
  yPosition += 20;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('DADOS DO CLIENTE', margin, yPosition);
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Nome: ${measurement.clientName}`, margin, yPosition);
  
  yPosition += 8;
  doc.text(`Data: ${new Date(measurement.date).toLocaleDateString('pt-BR')}`, margin, yPosition);
  doc.text(`Horário: ${measurement.time}`, margin + 80, yPosition);
  
  // Medidas aferidas
  yPosition += 20;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('MEDIDAS AFERIDAS', margin, yPosition);
  
  // Tabela de medidas
  yPosition += 15;
  
  // Cabeçalho da tabela
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 10, 'F');
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('MEDIDA', margin + 5, yPosition);
  doc.text('VALOR', margin + 80, yPosition);
  doc.text('UNIDADE', margin + 130, yPosition);
  
  yPosition += 15;
  doc.setFont(undefined, 'normal');
  
  // DP Binocular
  if (measurement.dp) {
    doc.text('DP (Binocular)', margin + 5, yPosition);
    doc.text(measurement.dp, margin + 80, yPosition);
    doc.text('mm', margin + 130, yPosition);
    yPosition += 10;
  }
  
  // DNP Esquerda
  if (measurement.dnpLeft) {
    doc.text('DNP Esquerda', margin + 5, yPosition);
    doc.text(measurement.dnpLeft, margin + 80, yPosition);
    doc.text('mm', margin + 130, yPosition);
    yPosition += 10;
  }
  
  // DNP Direita
  if (measurement.dnpRight) {
    doc.text('DNP Direita', margin + 5, yPosition);
    doc.text(measurement.dnpRight, margin + 80, yPosition);
    doc.text('mm', margin + 130, yPosition);
    yPosition += 10;
  }
  
  // Altura Esquerda
  if (measurement.heightLeft) {
    doc.text('Altura Esquerda', margin + 5, yPosition);
    doc.text(measurement.heightLeft, margin + 80, yPosition);
    doc.text('mm', margin + 130, yPosition);
    yPosition += 10;
  }
  
  // Altura Direita
  if (measurement.heightRight) {
    doc.text('Altura Direita', margin + 5, yPosition);
    doc.text(measurement.heightRight, margin + 80, yPosition);
    doc.text('mm', margin + 130, yPosition);
    yPosition += 10;
  }
  
  // Largura da Armação
  doc.text('Largura da Armação', margin + 5, yPosition);
  doc.text(measurement.frameWidth, margin + 80, yPosition);
  doc.text('mm', margin + 130, yPosition);
  
  // Rodapé
  yPosition = doc.internal.pageSize.height - 30;
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'italic');
  doc.text('Este documento foi gerado automaticamente pelo sistema Pupilômetro', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 6;
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
  
  // Abrir em nova aba para impressão
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  const newWindow = window.open(pdfUrl, '_blank');
  if (newWindow) {
    newWindow.onload = () => {
      newWindow.print();
    };
  }
  
  return pdfUrl;
};
