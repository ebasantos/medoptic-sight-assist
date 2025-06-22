
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SignupFormProps {
  onBackToLogin: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('=== INICIANDO CADASTRO ===');
      console.log('Email:', email);
      const isAdmin = email === 'erik@admin.com';
      console.log('É admin?', isAdmin);
      
      // Tentar criar usuário através do signup
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      console.log('Resultado do signup:', { signupData, signupError });

      // Se houve erro mas conseguimos o usuário, continuar
      if (signupError && !signupData?.user) {
        // Se for erro de rate limit ou similar, tentar abordagem alternativa
        if (signupError.message.includes('rate limit') || 
            signupError.message.includes('email') ||
            signupError.message.includes('confirmation')) {
          
          console.log('Erro de email detectado, tentando abordagem alternativa...');
          
          // Verificar se o usuário já existe tentando fazer login
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (loginData.user && !loginError) {
            console.log('Usuário já existe e senha confere');
            toast({
              title: "Usuário já existe",
              description: "Este email já está cadastrado. Redirecionando para login...",
            });
            onBackToLogin();
            return;
          }

          // Se não conseguiu fazer login, mostrar erro mais amigável
          toast({
            title: "Cadastro Temporariamente Indisponível",
            description: "Devido a limitações do sistema de email, novos cadastros estão temporariamente suspensos. Tente novamente em alguns minutos ou contate o suporte.",
            variant: "destructive"
          });
          return;
        } else {
          throw signupError;
        }
      }

      // Se conseguimos criar o usuário (mesmo com warning de email)
      if (signupData?.user) {
        console.log('Usuário criado:', signupData.user.id);
        
        // Inserir dados na tabela usuarios_optica
        const userData = {
          user_id: signupData.user.id,
          nome: name,
          email: email,
          role: isAdmin ? 'admin' : 'funcionario',
          optica_id: isAdmin ? null : undefined,
          ativo: true
        };

        console.log('Inserindo dados na tabela usuarios_optica:', userData);
        const { data: insertData, error: userError } = await supabase
          .from('usuarios_optica')
          .insert(userData)
          .select();

        if (userError) {
          console.error('Erro ao inserir na tabela usuarios_optica:', userError);
          throw new Error(`Erro no banco de dados: ${userError.message}`);
        }

        console.log('=== CADASTRO CONCLUÍDO ===');
        console.log('Dados inseridos:', insertData);
        
        toast({
          title: "Sucesso!",
          description: "Conta criada com sucesso! Você pode fazer login agora (não é necessário confirmar o email).",
        });
        
        setEmail('');
        setPassword('');
        setName('');
        onBackToLogin();
      }

    } catch (error: any) {
      console.error('=== ERRO NO CADASTRO ===', error);
      
      let errorMessage = "Erro inesperado. Tente novamente.";
      
      if (error.message?.includes('User already registered')) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido. Verifique o formato.";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres.";
      } else if (error.message?.includes('rate limit') || error.message?.includes('email')) {
        errorMessage = "Sistema temporariamente indisponível para novos cadastros devido a limitações de email. Tente novamente em alguns minutos.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro de Cadastro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Criar Conta
        </CardTitle>
        <p className="text-gray-600">
          Cadastre-se no Pupilometro PRO
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={isLoading}
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <Button
            variant="link"
            onClick={onBackToLogin}
            disabled={isLoading}
          >
            Já tem uma conta? Fazer login
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-medium mb-2">⚠️ Limitação Temporária</p>
          <p>O sistema está com limitações no envio de emails.</p>
          <p className="mt-1">Novos cadastros podem funcionar, mas a confirmação por email não é necessária.</p>
          <p className="mt-2"><strong>erik@admin.com</strong> cria conta admin.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
