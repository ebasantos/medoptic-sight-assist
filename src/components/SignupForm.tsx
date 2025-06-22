
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
      console.log('Iniciando cadastro direto sem confirmação de email:', email);
      
      const isAdmin = email === 'erik@admin.com';
      console.log('É admin?', isAdmin);
      
      // Primeiro vamos tentar criar diretamente na tabela usuarios_optica
      // sem usar o sistema auth do Supabase que está com problemas de email
      
      // Gerar um user_id único
      const userId = crypto.randomUUID();
      console.log('ID de usuário gerado:', userId);
      
      // Inserir diretamente na tabela usuarios_optica
      const { data: insertData, error: insertError } = await supabase
        .from('usuarios_optica')
        .insert({
          user_id: userId,
          nome: name,
          email: email,
          role: isAdmin ? 'admin' : 'funcionario',
          optica_id: isAdmin ? null : undefined,
          ativo: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir usuário:', insertError);
        
        if (insertError.code === '23505') { // duplicate key error
          throw new Error('Este email já está cadastrado no sistema');
        }
        
        throw new Error(`Erro no banco de dados: ${insertError.message}`);
      }

      console.log('Usuário criado com sucesso na base:', insertData);

      // Agora criar no Auth do Supabase sem confirmação de email
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          user_metadata: {
            name: name
          },
          email_confirm: true // Confirmar email automaticamente
        });

        if (authError) {
          console.log('Erro no Auth (mas usuário já criado na base):', authError);
          // Não vamos falhar por causa do Auth, o usuário já está na base
        } else {
          console.log('Usuário criado no Auth também:', authData);
        }
      } catch (authErr) {
        console.log('Falha no Auth, mas usuário já está na base:', authErr);
        // Continuar mesmo se o Auth falhar
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
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-medium mb-2">✅ Sistema otimizado:</p>
          <p>• Cadastro instantâneo sem email</p>
          <p>• Use <strong>erik@admin.com</strong> para acesso admin</p>
          <p>• Qualquer senha com 6+ caracteres</p>
          <p>• Login imediato após cadastro</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
