
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  LogOut,
  Eye,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { LensSimulatorStats } from '@/components/LensSimulatorStats';
import { OpticLensUsageStats } from '@/components/OpticLensUsageStats';
import CreateOpticModal from '@/components/CreateOpticModal';
import CreateUserModal from '@/components/CreateUserModal';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { opticas, stats, lensSimulationStats, opticUsageData, loading, fetchDashboardData, toggleOpticStatus } = useAdminDashboard();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Painel Administrativo</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Olá, {user?.name}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Óticas</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOpticas}</div>
              <p className="text-xs text-gray-500">
                {stats.opticasAtivas} ativas, {stats.opticasBloqueadas} bloqueadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
              <p className="text-xs text-gray-500">Distribuídos nas óticas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aferições</CardTitle>
              <BarChart3 className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAfericoes}</div>
              <p className="text-xs text-gray-500">Medições tradicionais</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Simulações IA</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalSimulacoes}</div>
              <p className="text-xs text-gray-500">Simulador de lentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sistema</CardTitle>
              <Settings className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Online</div>
              <p className="text-xs text-gray-500">Funcionando</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para organizar conteúdo */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="lens-simulator">Simulador de Lentes</TabsTrigger>
            <TabsTrigger value="detailed-usage">Uso por Ótica</TabsTrigger>
            <TabsTrigger value="optics">Gerenciar Óticas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Ações Rápidas
                  </CardTitle>
                  <CardDescription>Gerenciar óticas e usuários</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CreateOpticModal onOpticCreated={fetchDashboardData} />
                  <CreateUserModal 
                    opticas={opticas.map(o => ({ id: o.id, nome: o.nome }))} 
                    onUserCreated={fetchDashboardData} 
                  />
                  <Button className="w-full justify-start h-12" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Relatório de Uso
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Atividades</CardTitle>
                  <CardDescription>Últimas estatísticas do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total de Medições</span>
                      <Badge variant="outline">{stats.totalAfericoes}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Simulações de Lentes</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">{stats.totalSimulacoes}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Óticas Ativas</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">{stats.opticasAtivas}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Usuários Totais</span>
                      <Badge variant="outline">{stats.totalUsuarios}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="lens-simulator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Estatísticas do Simulador de Lentes
                </CardTitle>
                <CardDescription>
                  Acompanhe o uso da nova funcionalidade de simulação IA pelas óticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LensSimulatorStats stats={lensSimulationStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed-usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Análise Detalhada por Ótica
                </CardTitle>
                <CardDescription>
                  Visualização completa do uso do simulador de lentes por cada ótica individual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OpticLensUsageStats opticUsageData={opticUsageData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Óticas Cadastradas</CardTitle>
                <CardDescription>Gerencie suas óticas parceiras</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opticas.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma ótica cadastrada ainda</p>
                      <p className="text-sm">Use o botão "Criar Nova Ótica" para começar</p>
                    </div>
                  ) : (
                    opticas.map((optica) => (
                      <div key={optica.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{optica.nome}</h3>
                            <Badge 
                              variant={optica.ativo ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {optica.ativo ? 'ativa' : 'bloqueada'}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-500 mb-1">
                            <span>{optica.users} usuários</span>
                            <span>{optica.measurements} aferições</span>
                            <span className="text-blue-600 font-medium">{optica.lensSimulations} simulações IA</span>
                          </div>
                          <p className="text-xs text-gray-400">{optica.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-warning hover:text-warning"
                            onClick={() => toggleOpticStatus(optica.id, optica.ativo)}
                          >
                            {optica.ativo ? 
                              <Lock className="h-4 w-4" /> : 
                              <Unlock className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
