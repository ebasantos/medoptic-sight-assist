
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Eye,
  Printer,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);

  const mockMeasurements = [
    {
      id: 1,
      clientName: 'Maria Silva Santos',
      date: '2024-06-01',
      time: '10:30',
      dp: '62.5',
      dnpLeft: '31.0',
      dnpRight: '31.5',
      heightLeft: '22.0',
      heightRight: '22.2',
      frameWidth: '135',
      type: 'aferição'
    },
    {
      id: 2,
      clientName: 'João Carlos Oliveira',
      date: '2024-06-01',
      time: '09:45',
      dp: '65.0',
      dnpLeft: '32.5',
      dnpRight: '32.5',
      heightLeft: '24.0',
      heightRight: '23.8',
      frameWidth: '140',
      type: 'aferição'
    },
    {
      id: 3,
      clientName: 'Ana Costa Lima',
      date: '2024-06-01',
      time: '09:15',
      frameStyle: 'Gatinho',
      colors: ['Preto', 'Dourado'],
      confidence: 95,
      type: 'sugestão'
    },
    {
      id: 4,
      clientName: 'Carlos Eduardo Santos',
      date: '2024-05-31',
      time: '16:20',
      dp: '58.0',
      dnpLeft: '29.0',
      dnpRight: '29.0',
      heightLeft: '20.5',
      heightRight: '20.5',
      frameWidth: '130',
      type: 'aferição'
    }
  ];

  const filteredMeasurements = mockMeasurements.filter(measurement =>
    measurement.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (measurement: any) => {
    setSelectedMeasurement(measurement);
  };

  const handlePrint = (measurement: any) => {
    console.log('Imprimindo ficha para:', measurement.clientName);
    // Aqui implementaria a lógica de impressão
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/optica')}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Histórico de Atendimentos</h1>
              <p className="text-sm text-gray-600">Consulte aferições e sugestões anteriores</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedMeasurement ? (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar por nome do cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filtros
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{filteredMeasurements.length}</p>
                  <p className="text-sm text-gray-600">Total de Registros</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-success">
                    {filteredMeasurements.filter(m => m.type === 'aferição').length}
                  </p>
                  <p className="text-sm text-gray-600">Aferições</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {filteredMeasurements.filter(m => m.type === 'sugestão').length}
                  </p>
                  <p className="text-sm text-gray-600">Sugestões</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-warning">Hoje</p>
                  <p className="text-sm text-gray-600">Última Atualização</p>
                </CardContent>
              </Card>
            </div>

            {/* Measurements List */}
            <Card>
              <CardHeader>
                <CardTitle>Registros de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredMeasurements.map((measurement) => (
                    <div key={measurement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{measurement.clientName}</h3>
                          <Badge 
                            variant={measurement.type === 'aferição' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {measurement.type === 'aferição' ? 'Aferição' : 'Sugestão'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(measurement.date).toLocaleDateString('pt-BR')} às {measurement.time}
                          </div>
                          {measurement.type === 'aferição' && measurement.dp && (
                            <span className="font-medium">DP: {measurement.dp}mm</span>
                          )}
                          {measurement.type === 'sugestão' && measurement.frameStyle && (
                            <span className="font-medium">Estilo: {measurement.frameStyle}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(measurement)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                        {measurement.type === 'aferição' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePrint(measurement)}
                            className="flex items-center gap-2"
                          >
                            <Printer className="h-4 w-4" />
                            Reimprimir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Detailed View */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedMeasurement.clientName}</CardTitle>
                    <p className="text-gray-600">
                      {new Date(selectedMeasurement.date).toLocaleDateString('pt-BR')} às {selectedMeasurement.time}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedMeasurement(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {selectedMeasurement.type === 'aferição' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Medidas Aferidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">DP (Binocular):</span>
                        <span className="text-xl font-bold text-primary">{selectedMeasurement.dp} mm</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-sm text-gray-600">DNP Esquerda</p>
                          <p className="text-lg font-bold">{selectedMeasurement.dnpLeft} mm</p>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-sm text-gray-600">DNP Direita</p>
                          <p className="text-lg font-bold">{selectedMeasurement.dnpRight} mm</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-sm text-gray-600">Altura Esquerda</p>
                          <p className="text-lg font-bold">{selectedMeasurement.heightLeft} mm</p>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-sm text-gray-600">Altura Direita</p>
                          <p className="text-lg font-bold">{selectedMeasurement.heightRight} mm</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-medium">Largura da Armação:</span>
                        <span className="text-xl font-bold text-success">{selectedMeasurement.frameWidth} mm</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Foto Capturada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Eye className="h-16 w-16 mx-auto mb-4" />
                        <p>Foto da aferição</p>
                        <p className="text-sm">Imagem não disponível no demo</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4" onClick={() => handlePrint(selectedMeasurement)}>
                      <Printer className="h-4 w-4 mr-2" />
                      Reimprimir Ficha Técnica
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Sugestão de Armação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-lg font-bold mb-2">{selectedMeasurement.frameStyle}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-600">Confiança:</span>
                        <Badge variant="secondary">{selectedMeasurement.confidence}%</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Cores recomendadas:</p>
                        <div className="flex gap-2">
                          {selectedMeasurement.colors?.map((color: string, index: number) => (
                            <Badge key={index} variant="outline">{color}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
