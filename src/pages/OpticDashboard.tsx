
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Search, 
  History, 
  BarChart3, 
  LogOut,
  Eye,
  Ruler,
  Users,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useOpticDashboard } from '@/hooks/useOpticDashboard';

const OpticDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { stats, recentMeasurements, loading } = useOpticDashboard();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickStats = [
    { 
      label: 'Aferições Hoje', 
      value: stats.afericoesHoje.toString(), 
      icon: Ruler, 
      color: 'text-primary' 
    },
    { 
      label: 'Esta Semana', 
      value: stats.afericoesSemana.toString(), 
      icon: Calendar, 
      color: 'text-success' 
    },
    { 
      label: 'Total Clientes', 
      value: stats.totalClientes.toString(), 
      icon: Users, 
      color: 'text-warning' 
    },
    { 
      label: 'Sugestões Geradas', 
      value: stats.sugestoesGeradas.toString(), 
      icon: Eye, 
      color: 'text-purple-600' 
    }
  ];

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
              <Eye className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{user?.opticName}</h1>
                <p className="text-sm text-gray-600">Sistema de Aferição</p>
              </div>
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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer animate-slide-in" 
                onClick={() => navigate('/aferir')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-xl">Aferição de Medidas</CardTitle>
              <CardDescription className="text-base">
                Capture foto do cliente e realize medições precisas das distâncias pupilares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full h-14 text-lg font-medium">
                Iniciar Aferição
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer animate-slide-in" 
                style={{ animationDelay: '0.2s' }}
                onClick={() => navigate('/sugestao')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-success/10 rounded-full w-fit">
                <Search className="h-12 w-12 text-success" />
              </div>
              <CardTitle className="text-xl">Sugestão de Armação</CardTitle>
              <CardDescription className="text-base">
                Analise o formato facial e sugira armações ideais para cada cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full h-14 text-lg font-medium bg-success hover:bg-success/90">
                Sugerir Armações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Ações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 text-base"
                onClick={() => navigate('/historico')}
              >
                <History className="h-5 w-5 mr-3" />
                Histórico de Aferições
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 text-base"
              >
                <BarChart3 className="h-5 w-5 mr-3" />
                Relatórios e Estatísticas
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle>Aferições Recentes</CardTitle>
              <CardDescription>Últimos clientes atendidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMeasurements.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Ruler className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma aferição realizada ainda</p>
                    <p className="text-sm">Comece fazendo sua primeira aferição</p>
                  </div>
                ) : (
                  recentMeasurements.map((measurement) => (
                    <div key={measurement.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{measurement.nome_cliente}</p>
                        <p className="text-sm text-gray-500">{formatTime(measurement.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          DP: {measurement.dp_binocular ? `${measurement.dp_binocular}mm` : 'N/A'}
                        </p>
                        <Button size="sm" variant="outline" className="text-xs">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OpticDashboard;
