
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react';

interface LensSimulationStats {
  totalSimulacoes: number;
  simulacoesHoje: number;
  simulacoesSemana: number;
  opticasMaisAtivas: Array<{
    nome: string;
    simulacoes: number;
  }>;
  tiposLentePopulares: Array<{
    tipo: string;
    quantidade: number;
  }>;
}

interface LensSimulatorStatsProps {
  stats: LensSimulationStats;
}

export const LensSimulatorStats: React.FC<LensSimulatorStatsProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Simulações</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalSimulacoes}</div>
            <p className="text-xs text-gray-500">Todas as óticas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.simulacoesHoje}</div>
            <p className="text-xs text-gray-500">Simulações hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.simulacoesSemana}</div>
            <p className="text-xs text-gray-500">Últimos 7 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking e análises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Óticas Mais Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.opticasMaisAtivas.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma simulação registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.opticasMaisAtivas.map((optica, index) => (
                  <div key={optica.nome} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={index === 0 ? 'default' : 'secondary'}
                        className={`${index === 0 ? 'bg-yellow-500' : ''} w-8 h-8 rounded-full flex items-center justify-center`}
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{optica.nome}</p>
                        <p className="text-sm text-gray-500">{optica.simulacoes} simulações</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{optica.simulacoes}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Tipos de Lente Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.tiposLentePopulares.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum tipo de lente registrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.tiposLentePopulares.map((lente, index) => (
                  <div key={lente.tipo} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <div>
                        <p className="font-medium capitalize">{lente.tipo}</p>
                        <p className="text-sm text-gray-500">{lente.quantidade} simulações</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600">{lente.quantidade}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
