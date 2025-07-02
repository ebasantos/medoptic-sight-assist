
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  BarChart3, 
  Building2, 
  Users, 
  Eye, 
  Calendar, 
  TrendingUp,
  Download,
  FileText
} from 'lucide-react';

interface OpticData {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  ativo: boolean;
  created_at: string;
  users: number;
  measurements: number;
  lensSimulations: number;
}

interface DashboardStats {
  totalOpticas: number;
  opticasAtivas: number;
  opticasBloqueadas: number;
  totalUsuarios: number;
  totalAfericoes: number;
  totalSimulacoes: number;
}

interface OpticUsageData {
  id: string;
  nome: string;
  totalSimulacoes: number;
  simulacoesHoje: number;
  simulacoesSemana: number;
  tiposLenteMaisUsados: Array<{
    tipo: string;
    quantidade: number;
  }>;
  usuariosAtivos: number;
  ultimaSimulacao?: string;
}

interface UsageReportModalProps {
  opticas: OpticData[];
  stats: DashboardStats;
  opticUsageData: OpticUsageData[];
}

export const UsageReportModal: React.FC<UsageReportModalProps> = ({ 
  opticas, 
  stats, 
  opticUsageData 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generateReport = () => {
    const reportData = {
      geradoEm: new Date().toLocaleString('pt-BR'),
      resumoGeral: stats,
      detalhesOpticas: opticas.map(optica => {
        const usageData = opticUsageData.find(u => u.id === optica.id);
        return {
          ...optica,
          ...usageData
        };
      })
    };

    const reportText = `
RELATÓRIO DE USO - SISTEMA DE ÓTICAS
Gerado em: ${reportData.geradoEm}

=== RESUMO GERAL ===
Total de Óticas: ${stats.totalOpticas}
Óticas Ativas: ${stats.opticasAtivas}
Óticas Bloqueadas: ${stats.opticasBloqueadas}
Total de Usuários: ${stats.totalUsuarios}
Total de Aferições: ${stats.totalAfericoes}
Total de Simulações IA: ${stats.totalSimulacoes}

=== DETALHES POR ÓTICA ===
${reportData.detalhesOpticas.map(optica => `
Ótica: ${optica.nome}
Email: ${optica.email}
Status: ${optica.ativo ? 'Ativa' : 'Bloqueada'}
Usuários: ${optica.users}
Aferições: ${optica.measurements}
Simulações IA: ${optica.totalSimulacoes || 0}
Simulações Hoje: ${optica.simulacoesHoje || 0}
Simulações Semana: ${optica.simulacoesSemana || 0}
Usuários Ativos: ${optica.usuariosAtivos || 0}
Cadastrada em: ${formatDate(optica.created_at)}
${optica.ultimaSimulacao ? `Última Simulação: ${formatDate(optica.ultimaSimulacao)}` : 'Nenhuma simulação'}
---`).join('\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-uso-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Renderizar versão mobile com cards ao invés de tabela
  const renderMobileView = () => (
    <div className="space-y-4">
      {opticas.map((optica) => {
        const usageData = opticUsageData.find(u => u.id === optica.id);
        return (
          <Card key={optica.id} className="p-3">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{optica.nome}</h3>
                  <p className="text-xs text-gray-500 truncate">{optica.email}</p>
                </div>
                <Badge variant={optica.ativo ? 'default' : 'destructive'} className="text-xs">
                  {optica.ativo ? 'Ativa' : 'Bloqueada'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuários:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                    {optica.users}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aferições:</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                    {optica.measurements}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Simulações:</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                    {optica.lensSimulations}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hoje:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                    {usageData?.simulacoesHoje || 0}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Semana:</span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-xs">
                    {usageData?.simulacoesSemana || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ativos:</span>
                  <span className="text-xs">{usageData?.usuariosAtivos || 0}</span>
                </div>
              </div>

              {usageData?.tiposLenteMaisUsados && usageData.tiposLenteMaisUsados.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Tipos de Lente:</p>
                  <div className="flex flex-wrap gap-1">
                    {usageData.tiposLenteMaisUsados.slice(0, 2).map((tipo, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <span className="text-xs capitalize">{tipo.tipo}</span>
                        <Badge variant="secondary" className="text-xs">
                          {tipo.quantidade}x
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-1 border-t text-xs text-gray-500">
                <div>Cadastro: {formatDate(optica.created_at)}</div>
                {usageData?.ultimaSimulacao && (
                  <div>Última sim: {formatDate(usageData.ultimaSimulacao)}</div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start h-12" variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Relatório de Uso
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh] p-4' : 'max-w-6xl max-h-[90vh]'} overflow-hidden`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Relatório Detalhado de Uso
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Resumo Geral */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>Resumo Geral do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-6'} gap-3`}>
                <div className="text-center">
                  <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-600`}>{stats.totalOpticas}</div>
                  <div className="text-xs text-gray-600">Total Óticas</div>
                </div>
                <div className="text-center">
                  <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>{stats.opticasAtivas}</div>
                  <div className="text-xs text-gray-600">Ativas</div>
                </div>
                <div className="text-center">
                  <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>{stats.opticasBloqueadas}</div>
                  <div className="text-xs text-gray-600">Bloqueadas</div>
                </div>
                <div className="text-center">
                  <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-600`}>{stats.totalUsuarios}</div>
                  <div className="text-xs text-gray-600">Usuários</div>
                </div>
                <div className="text-center">
                  <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-orange-600`}>{stats.totalAfericoes}</div>
                  <div className="text-xs text-gray-600">Aferições</div>
                </div>
                <div className="text-center">
                  <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-indigo-600`}>{stats.totalSimulacoes}</div>
                  <div className="text-xs text-gray-600">Simulações IA</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Tabela Detalhada ou Cards Mobile */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>Detalhamento por Ótica</CardTitle>
              <Button onClick={generateReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {isMobile ? 'Baixar' : 'Baixar Relatório'}
              </Button>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <ScrollArea className="h-80">
                  {renderMobileView()}
                </ScrollArea>
              ) : (
                <ScrollArea className="h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ótica</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Usuários</TableHead>
                        <TableHead className="text-center">Aferições</TableHead>
                        <TableHead className="text-center">Simulações IA</TableHead>
                        <TableHead className="text-center">Hoje</TableHead>
                        <TableHead className="text-center">Semana</TableHead>
                        <TableHead className="text-center">Usuários Ativos</TableHead>
                        <TableHead>Tipos de Lente</TableHead>
                        <TableHead>Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opticas.map((optica) => {
                        const usageData = opticUsageData.find(u => u.id === optica.id);
                        return (
                          <TableRow key={optica.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{optica.nome}</div>
                                <div className="text-sm text-gray-500">{optica.email}</div>
                                {optica.telefone && (
                                  <div className="text-xs text-gray-400">{optica.telefone}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={optica.ativo ? 'default' : 'destructive'}>
                                {optica.ativo ? 'Ativa' : 'Bloqueada'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {optica.users}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                                {optica.measurements}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {optica.lensSimulations}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                {usageData?.simulacoesHoje || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                                {usageData?.simulacoesSemana || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Users className="h-3 w-3 text-gray-500" />
                                {usageData?.usuariosAtivos || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              {usageData?.tiposLenteMaisUsados && usageData.tiposLenteMaisUsados.length > 0 ? (
                                <div className="space-y-1">
                                  {usageData.tiposLenteMaisUsados.slice(0, 2).map((tipo, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                      <span className="text-xs capitalize">{tipo.tipo}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {tipo.quantidade}x
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(optica.created_at)}
                              </div>
                              {usageData?.ultimaSimulacao && (
                                <div className="text-xs text-gray-500">
                                  Última sim: {formatDate(usageData.ultimaSimulacao)}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
                <TrendingUp className="h-5 w-5" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Taxa de Adoção do Simulador IA</h4>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
                    {Math.round((opticUsageData.filter(o => o.totalSimulacoes > 0).length / opticas.length) * 100)}%
                  </div>
                  <p className="text-xs text-gray-600">
                    {opticUsageData.filter(o => o.totalSimulacoes > 0).length} de {opticas.length} óticas usaram o simulador
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Média de Simulações por Ótica Ativa</h4>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                    {opticUsageData.filter(o => o.totalSimulacoes > 0).length > 0 
                      ? Math.round(stats.totalSimulacoes / opticUsageData.filter(o => o.totalSimulacoes > 0).length)
                      : 0}
                  </div>
                  <p className="text-xs text-gray-600">
                    Simulações por ótica que usa a ferramenta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
