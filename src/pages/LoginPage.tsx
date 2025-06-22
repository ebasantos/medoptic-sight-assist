import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SignupForm from '@/components/SignupForm';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  console.log('🖥️ Renderizando LoginPage...');
  const {
    login,
    isAuthenticated,
    loading,
    user
  } = useAuth();
  console.log('📊 Estado do Auth:', {
    isAuthenticated,
    loading,
    userEmail: user?.email
  });

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    console.log('🔄 Verificando redirecionamento...', {
      loading,
      isAuthenticated,
      userRole: user?.role
    });
    if (!loading && isAuthenticated && user) {
      console.log('🔀 Usuário autenticado, redirecionando...', user.role);
      const redirectPath = user.role === 'admin' ? '/admin' : '/optica';
      navigate(redirectPath, {
        replace: true
      });
    }
  }, [isAuthenticated, user, navigate, loading]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      console.log('🔐 Tentando login com:', email);
      const success = await login(email, password);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!"
        });
      } else {
        toast({
          title: "Erro de Login",
          description: "Email ou senha incorretos. Verifique suas credenciais e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado durante o login. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading apenas enquanto verifica autenticação inicial
  if (loading) {
    console.log('⏳ Mostrando tela de loading...');
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>;
  }
  if (showSignup) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <SignupForm onBackToLogin={() => setShowSignup(false)} />
      </div>;
  }
  console.log('✅ Renderizando formulário de login...');
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Pupilômetro</CardTitle>
          <p className="text-gray-600">
            por EBS Tecnologia
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={isLoading} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required disabled={isLoading} />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </> : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            
            
            
            
            <p className="mt-2 text-xs">Desenvolvido por EBS Tecnologia</p>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default LoginPage;