
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Loader2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'funcionario',
    optica_id: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
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
      console.log('Criando novo usuário:', formData);
      console.log('Usuário logado:', user);

      // Gerar um user_id único
      const userId = crypto.randomUUID();
      
      // Inserir usuário na tabela usuarios_optica
      const { data: userData, error: userError } = await supabase
        .from('usuarios_optica')
        .insert({
          user_id: userId,
          nome: formData.nome,
          email: formData.email,
          role: formData.role,
          optica_id: formData.role === 'admin' ? null : formData.optica_id,
          ativo: true
        })
        .select()
        .single();

      if (userError) {
        console.error('Erro ao criar usuário:', userError);
        
        if (userError.code === '23505') {
          throw new Error('Este email já está cadastrado no sistema');
        }
        
        throw new Error(`Erro no banco de dados: ${userError.message}`);
      }

      console.log('Usuário criado com sucesso:', userData);

      toast({
        title: "Sucesso!",
        description: "Usuário criado com sucesso",
      });

      // Limpar formulário e fechar modal
      setFormData({
        nome: '',
        email: '',
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
