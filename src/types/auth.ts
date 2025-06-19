
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'funcionario';
  opticId?: string;
  opticName?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export interface UserData {
  user_id: string;
  nome: string;
  email: string;
  role: 'admin' | 'funcionario';
  optica_id: string | null;
  opticas?: {
    id: string;
    nome: string;
  } | null;
}
