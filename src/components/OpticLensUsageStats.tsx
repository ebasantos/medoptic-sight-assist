
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { Building2, Eye, TrendingUp, Clock, Users, BarChart3 } from 'lucide-react';

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

interface OpticLensUsageStatsProps {
  opticUsageData: OpticUsageData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const chartConfig = {
  simulacoes: {
    label: "Simulações",
    color: "#2563eb",
  },
};

export const OpticLensUsageStats: React.FC<OpticLensUsageStatsProps> = ({ opticUsageData }) => {
  // Preparar dados para gráfico de barras
  const chartData = opticUsageData
    .sort((a, b) => b.totalSimulacoes - a.totalSimulacoes)
    .slice(0, 10)
    .map(optica => ({
      nome: optica.nome.length > 15 ? optica.nome.substring(0, 15) + '...' : optica.nome,
      simulacoes: optica.totalSimulacoes
    }));

  // Preparar dados para gráfico de pizza dos tipos de lente
  const allLensTypes = opticUsageData.reduce((acc, optica) => {
    optica.tiposLenteMaisUsados.forEach(tipo => {
      acc[tipo.tipo] = (acc[tipo.tipo] || 0) + tipo.quantidade;
    });
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(allLensTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tipo, quantidade]) => ({
      name: tipo,
      value: quantidade
    }));

  const totalSimulacoes = opticUsageData.reduce((sum, optica) => sum + optica.totalSimulacoes, 0);
  const opticasComSimulacoes = opticUsageData.filter(o => o.totalSimulacoes > 0).length;

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Simulações</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSimulacoes}</div>
            <p className="text-xs text-gray-500">Todas as óticas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Óticas Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{opticasComSimulacoes}</div>
            <p className="text-xs text-gray-500">Com simulações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Média por Ótica</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {opticasComSimulacoes > 0 ? Math.round(totalSimulacoes / opticasComSimulacoes) : 0}
            </div>
            <p className="text-xs text-gray-500">Simulações/ótica</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Adoção</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((opticasComSimulacoes / opticUsageData.length) * 100)}%
            </div>
            <p className="text-xs text-gray-500">Óticas usando</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Top 10 Óticas por Simulações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-80">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="nome" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                  />
                  <Bar 
                    dataKey="simulacoes" 
                    fill="var(--color-simulacoes)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma simulação registrada</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Tipos de Lente Mais Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-80">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum tipo de lente registrado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada por ótica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Detalhamento por Ótica
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opticUsageData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ótica</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Hoje</TableHead>
                  <TableHead className="text-center">Semana</TableHead>
                  <TableHead className="text-center">Usuários</TableHead>
                  <TableHead>Tipo Mais Usado</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opticUsageData
                  .sort((a, b) => b.totalSimulacoes - a.totalSimulacoes)
                  .map((optica) => (
                    <TableRow key={optica.id}>
                      <TableCell className="font-medium">{optica.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {optica.totalSimulacoes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {optica.simulacoesHoje}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {optica.simulacoesSemana}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-gray-500" />
                          {optica.usuariosAtivos}
                        </div>
                      </TableCell>
                      <TableCell>
                        {optica.tiposLenteMaisUsados.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="capitalize text-sm">
                              {optica.tiposLenteMaisUsados[0].tipo}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {optica.tiposLenteMaisUsados[0].quantidade}x
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {optica.totalSimulacoes > 0 ? (
                          <Badge className="bg-green-100 text-green-800">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            Inativa
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma ótica encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
