
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
      
      // Fazer o signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Erro no signup:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('Usuário criado:', authData.user.id);
        
        // Se o email for erik@admin.com, criar entrada de admin
        if (email === 'erik@admin.com') {
          console.log('Criando usuário admin...');
          
          // Primeiro, garantir que a ótica admin existe
          const { data: opticaData, error: opticaSelectError } = await supabase
            .from('opticas')
            .select('id')
            .eq('email', 'admin@medopticpro.com')
            .maybeSingle();

          let opticaId = opticaData?.id;

          // Se não existe, criar a ótica admin
          if (!opticaId) {
            console.log('Criando ótica admin...');
            const { data: novaOptica, error: opticaCreateError } = await supabase
              .from('opticas')
              .insert({
                nome: 'Administração',
                email: 'admin@medopticpro.com',
                telefone: '(11) 99999-9999',
                endereco: 'Sede Administrativa',
                ativo: true
              })
              .select('id')
              .single();

            if (opticaCreateError) {
              console.error('Erro ao criar ótica admin:', opticaCreateError);
              throw opticaCreateError;
            }

            opticaId = novaOptica.id;
            console.log('Ótica admin criada:', opticaId);
          }

          // Criar entrada na tabela usuarios_optica como admin
          const { error: userOpticaError } = await supabase
            .from('usuarios_optica')
            .insert({
              user_id: authData.user.id,
              optica_id: opticaId,
              nome: name,
              email: email,
              role: 'admin',
              ativo: true
            });

          if (userOpticaError) {
            console.error('Erro ao criar usuário admin:', userOpticaError);
            throw userOpticaError;
          } else {
            console.log('Usuário admin criado com sucesso');
          }
        }

        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso! Você pode fazer login agora.",
        });
        
        onBackToLogin();
      }
    } catch (error: any) {
      console.error('Erro no signup:', error);
      let errorMessage = "Erro inesperado. Tente novamente.";
      
      if (error.message?.includes('User already registered')) {
        errorMessage = "Este email já está cadastrado. Tente fazer login.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido. Verifique o formato do email.";
      } else if (error.message?.includes('Password')) {
        errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres.";
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
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Para acesso administrativo:</p>
          <p>Use o email <strong>erik@admin.com</strong> para criar uma conta admin.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
