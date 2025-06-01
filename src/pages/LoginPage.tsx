
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Glasses } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao MedOptic Pro",
        });
        
        // Redirecionar baseado no tipo de usuário
        if (email === 'admin@medoptic.com') {
          navigate('/admin');
        } else {
          navigate('/optica');
        }
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no sistema",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-full">
                <Glasses className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">MedOptic Pro</CardTitle>
            <CardDescription className="text-base">
              Sistema Inteligente para Óticas
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-12 text-base"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="h-12 text-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Usuários Demo:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><strong>Admin:</strong> admin@medoptic.com / admin123</p>
                <p><strong>Ótica:</strong> otica@demo.com / otica123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
