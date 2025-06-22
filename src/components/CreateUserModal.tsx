
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CreateUserModalProps {
  opticas: Array<{
    id: string;
    nome: string;
  }>;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ opticas, onUserCreated }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'funcionario',
    optica_id: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Nome, email e senha são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    if (formData.role === 'funcionario' && !formData.optica_id) {
      toast({
        title: "Erro",
        description: "Funcionários devem estar associados a uma ótica",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Criando novo usuário:', formData.email);

      // Verificar se já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios_optica')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar usuário existente:', checkError);
        throw new Error('Erro ao verificar usuário existente');
      }

      if (existingUser) {
        throw new Error('Este email já está cadastrado no sistema');
      }

      // Criar usuário no Supabase Auth (mesmo método do signup)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Sem redirect
          data: {
            name: formData.nome,
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
          nome: formData.nome,
          email: formData.email,
          role: formData.role,
          optica_id: formData.role === 'admin' ? null : formData.optica_id,
          ativo: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir usuário na tabela:', insertError);
        throw new Error(`Erro ao salvar dados do usuário: ${insertError.message}`);
      }

      console.log('Usuário criado com sucesso:', userData);

      // Confirmar email automaticamente
      if (authData.user && !authData.user.email_confirmed_at) {
        try {
          console.log('Confirmando email automaticamente...');
          const { error: confirmError } = await supabase.rpc('confirm_admin_email', { 
            admin_email: formData.email 
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
        description: "Usuário criado com sucesso. Ele pode fazer login agora.",
      });

      // Limpar formulário e fechar modal
      setFormData({
        nome: '',
        email: '',
        password: '',
        role: 'funcionario',
        optica_id: ''
      });
      setOpen(false);
      onUserCreated();

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = "Erro inesperado. Tente novamente.";
      
      if (error.message?.includes('já está cadastrado')) {
        errorMessage = "Este email já está cadastrado. Use outro email.";
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "Email inválido. Verifique o formato.";
      } else if (error.message?.includes('rate limit')) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao Criar Usuário",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start h-12" variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Adicionar Novo Usuário
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo do usuário"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
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
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
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
            <p className="text-xs text-gray-500">
              O usuário poderá fazer login com esta senha
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'funcionario' && (
            <div className="space-y-2">
              <Label htmlFor="optica">Ótica</Label>
              <Select 
                value={formData.optica_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, optica_id: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ótica" />
                </SelectTrigger>
                <SelectContent>
                  {opticas.map((optica) => (
                    <SelectItem key={optica.id} value={optica.id}>
                      {optica.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Nota sobre criação de usuários:</p>
            <p>• Usuários são criados diretamente sem confirmação de email</p>
            <p>• Podem fazer login imediatamente após criação</p>
            <p>• Administradores não precisam estar vinculados a óticas</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
