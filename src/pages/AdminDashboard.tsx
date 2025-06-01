
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  Shield,
  LogOut,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const mockOptics = [
    { id: 1, name: 'Ótica Visual+', users: 3, status: 'ativa', measurements: 156 },
    { id: 2, name: 'Ótica Elite', users: 2, status: 'ativa', measurements: 89 },
    { id: 3, name: 'Ótica Centro', users: 1, status: 'bloqueada', measurements: 45 },
  ];

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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Óticas</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-gray-500">2 ativas, 1 bloqueada</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-gray-500">Distribuídos nas óticas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aferições Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">290</div>
              <p className="text-xs text-gray-500">Este mês: +47</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sistema</CardTitle>
              <Settings className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Online</div>
              <p className="text-xs text-gray-500">Uptime: 99.9%</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>Gerenciar óticas e usuários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start h-12" variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Criar Nova Ótica
              </Button>
              <Button className="w-full justify-start h-12" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
              <Button className="w-full justify-start h-12" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatório de Uso
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Óticas Cadastradas</CardTitle>
              <CardDescription>Gerencie suas óticas parceiras</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockOptics.map((optic) => (
                  <div key={optic.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{optic.name}</h3>
                        <Badge 
                          variant={optic.status === 'ativa' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {optic.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {optic.users} usuários • {optic.measurements} aferições
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-warning hover:text-warning"
                      >
                        {optic.status === 'ativa' ? 
                          <Lock className="h-4 w-4" /> : 
                          <Unlock className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
