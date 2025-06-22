
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
      console.log('Iniciando cadastro para:', email);
      
      const isAdmin = email === 'erik@admin.com';
      console.log('É admin?', isAdmin);
      
      // Verificar se já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios_optica')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar usuário existente:', checkError);
        throw new Error('Erro ao verificar usuário existente');
      }

      if (existingUser) {
        throw new Error('Este email já está cadastrado no sistema');
      }

      // Criar usuário no Supabase Auth SEM confirmação de email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: undefined, // Sem redirect
          data: {
            name: name,
            email_confirm: false // Desabilitar confirmação
          }
        }
      });

      if (authError) {
        console.error('Erro ao criar usuário no Auth:', authError);
        throw new Error(`Erro na autenticação: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado no sistema de autenticação');
      }

      console.log('Usuário criado no Auth:', authData.user.id);
      
      // Inserir na tabela usuarios_optica
      const { data: userData, error: insertError } = await supabase
        .from('usuarios_optica')
        .insert({
          user_id: authData.user.id,
          nome: name,
          email: email,
          role: isAdmin ? 'admin' : 'funcionario',
          optica_id: isAdmin ? null : undefined,
          ativo: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir usuário na tabela:', insertError);
        
        // Limpar usuário do Auth se falhou na tabela
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Erro ao limpar usuário do Auth:', cleanupError);
        }
        
        throw new Error(`Erro ao salvar dados do usuário: ${insertError.message}`);
      }

      console.log('Usuário criado com sucesso:', userData);

      // Confirmar email automaticamente via função do banco
      if (authData.user && !authData.user.email_confirmed_at) {
        try {
          console.log('Confirmando email automaticamente...');
          const { error: confirmError } = await supabase.rpc('confirm_admin_email', { 
            admin_email: email 
          });
          
          if (confirmError) {
            console.error('Erro ao confirmar email:', confirmError);
          } else {
            console.log('Email confirmado automaticamente');
          }
        } catch (confirmError) {
          console.error('Erro ao confirmar email:', confirmError);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Conta criada com sucesso! Você pode fazer login agora.",
      });
      
      // Limpar formulário
      setEmail('');
      setPassword('');
      setName('');
      
      // Voltar para login
      onBackToLogin();

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      let errorMessage = "Erro inesperado. Tente novamente.";
      
      if (error.message?.includes('já está cadastrado')) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido. Verifique o formato.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
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
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <p className="font-medium mb-2">✅ Sistema sem confirmação de email:</p>
          <p>• Cadastro direto sem emails</p>
          <p>• Use <strong>erik@admin.com</strong> para acesso admin</p>
          <p>• Qualquer senha com 6+ caracteres</p>
          <p>• Login imediato após cadastro</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
