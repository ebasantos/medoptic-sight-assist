
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
      
      // Tentar criar usuário com confirmação automática
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirm: !isAdmin // Para admin não requer confirmação
          }
        }
      });

      console.log('Resultado signup:', { authData, authError });

      // Se deu erro de email, vamos tentar uma abordagem diferente
      if (authError && authError.message.includes('confirmation email')) {
        console.log('Erro de email detectado, tentando abordagem alternativa...');
        
        // Verificar se usuário já existe
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (existingUser.user) {
          console.log('Usuário já existe, direcionando para login...');
          toast({
            title: "Usuário já existe",
            description: "Este email já está cadastrado. Faça login.",
            variant: "destructive"
          });
          onBackToLogin();
          return;
        }
        
        throw authError;
      }

      if (authError) {
        console.error('Erro no signup:', authError);
        throw authError;
      }

      if (authData?.user) {
        console.log('Usuário criado no auth:', authData.user.id);
        
        // Se for admin, confirmar email automaticamente
        if (isAdmin) {
          console.log('Confirmando email do admin automaticamente...');
          const { error: confirmError } = await supabase.rpc('confirm_admin_email', {
            admin_email: email
          });
          
          if (confirmError) {
            console.warn('Erro ao confirmar email (ignorado):', confirmError);
          } else {
            console.log('Email do admin confirmado com sucesso!');
          }
        }
        
        // Aguardar um pouco para garantir que o usuário foi criado no auth
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Preparar dados do usuário
        const userData = {
          user_id: authData.user.id,
          nome: name,
          email: email,
          role: isAdmin ? 'admin' : 'funcionario',
          optica_id: isAdmin ? null : undefined,
          ativo: true
        };

        console.log('=== INSERINDO DADOS NA TABELA ===');
        console.log('Dados:', userData);
        
        // Tentar inserir na tabela usuarios_optica
        const { data: insertData, error: userError } = await supabase
          .from('usuarios_optica')
          .insert(userData)
          .select();

        console.log('Resultado insert:', { insertData, userError });

        if (userError) {
          console.error('Erro ao inserir na tabela usuarios_optica:', userError);
          
          // Fazer logout se falhou
          await supabase.auth.signOut();
          
          throw new Error(`Erro no banco de dados: ${userError.message}`);
        }

        console.log('=== CADASTRO CONCLUÍDO COM SUCESSO ===');
        
        toast({
          title: "Sucesso!",
          description: isAdmin 
            ? "Conta admin criada com sucesso! Email confirmado automaticamente. Agora você pode fazer login." 
            : "Conta criada com sucesso! Agora você pode fazer login.",
        });
        
        // Limpar formulário
        setEmail('');
        setPassword('');
        setName('');
        
        onBackToLogin();
      } else {
        throw new Error('Usuário não foi criado corretamente');
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
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
      } else if (error.message?.includes('confirmation email')) {
        errorMessage = "Sistema configurado sem validação de email. Tente novamente.";
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
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg text-sm text-green-800">
          <p className="font-medium mb-2">✅ Sistema Pronto!</p>
          <p>Use <strong>erik@admin.com</strong> para criar uma conta admin.</p>
          <p className="mt-1">Qualquer outro email criará uma conta de funcionário.</p>
          <p className="mt-2 text-xs font-medium">⚡ Login instantâneo - sem validação de email!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
