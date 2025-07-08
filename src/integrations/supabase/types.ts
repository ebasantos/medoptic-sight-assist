export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      afericoes: {
        Row: {
          altura_direita: number | null
          altura_esquerda: number | null
          created_at: string
          dnp_direita: number | null
          dnp_esquerda: number | null
          dp_binocular: number | null
          foto_url: string
          id: string
          largura_armacao: number
          largura_lente: number | null
          nome_cliente: string
          optica_id: string
          usuario_id: string
        }
        Insert: {
          altura_direita?: number | null
          altura_esquerda?: number | null
          created_at?: string
          dnp_direita?: number | null
          dnp_esquerda?: number | null
          dp_binocular?: number | null
          foto_url: string
          id?: string
          largura_armacao: number
          largura_lente?: number | null
          nome_cliente: string
          optica_id: string
          usuario_id: string
        }
        Update: {
          altura_direita?: number | null
          altura_esquerda?: number | null
          created_at?: string
          dnp_direita?: number | null
          dnp_esquerda?: number | null
          dp_binocular?: number | null
          foto_url?: string
          id?: string
          largura_armacao?: number
          largura_lente?: number | null
          nome_cliente?: string
          optica_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "afericoes_optica_id_fkey"
            columns: ["optica_id"]
            isOneToOne: false
            referencedRelation: "opticas"
            referencedColumns: ["id"]
          },
        ]
      }
      analises_faciais: {
        Row: {
          created_at: string
          distancia_olhos: string | null
          formato_rosto: string | null
          foto_url: string
          id: string
          nome_cliente: string
          optica_id: string
          sugestoes: Json | null
          tom_pele: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string
          distancia_olhos?: string | null
          formato_rosto?: string | null
          foto_url: string
          id?: string
          nome_cliente: string
          optica_id: string
          sugestoes?: Json | null
          tom_pele?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string
          distancia_olhos?: string | null
          formato_rosto?: string | null
          foto_url?: string
          id?: string
          nome_cliente?: string
          optica_id?: string
          sugestoes?: Json | null
          tom_pele?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analises_faciais_optica_id_fkey"
            columns: ["optica_id"]
            isOneToOne: false
            referencedRelation: "opticas"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_oculos: {
        Row: {
          altura_mm: number | null
          ativo: boolean | null
          categoria: string
          cores_disponiveis: Json
          created_at: string
          formato_recomendado: string
          id: string
          imagem_url: string
          largura_mm: number | null
          nome: string
          ponte_mm: number | null
          popular: boolean | null
          tom_pele_recomendado: string[] | null
        }
        Insert: {
          altura_mm?: number | null
          ativo?: boolean | null
          categoria: string
          cores_disponiveis?: Json
          created_at?: string
          formato_recomendado: string
          id?: string
          imagem_url: string
          largura_mm?: number | null
          nome: string
          ponte_mm?: number | null
          popular?: boolean | null
          tom_pele_recomendado?: string[] | null
        }
        Update: {
          altura_mm?: number | null
          ativo?: boolean | null
          categoria?: string
          cores_disponiveis?: Json
          created_at?: string
          formato_recomendado?: string
          id?: string
          imagem_url?: string
          largura_mm?: number | null
          nome?: string
          ponte_mm?: number | null
          popular?: boolean | null
          tom_pele_recomendado?: string[] | null
        }
        Relationships: []
      }
      opticas: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      simulacoes_lentes: {
        Row: {
          created_at: string
          dados_estilo_vida: Json | null
          id: string
          nome_cliente: string
          optica_id: string
          recomendacoes_ia: Json | null
          tipo_lente: string
          tratamentos: string[]
        }
        Insert: {
          created_at?: string
          dados_estilo_vida?: Json | null
          id?: string
          nome_cliente: string
          optica_id: string
          recomendacoes_ia?: Json | null
          tipo_lente: string
          tratamentos?: string[]
        }
        Update: {
          created_at?: string
          dados_estilo_vida?: Json | null
          id?: string
          nome_cliente?: string
          optica_id?: string
          recomendacoes_ia?: Json | null
          tipo_lente?: string
          tratamentos?: string[]
        }
        Relationships: []
      }
      usuarios_optica: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          optica_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome: string
          optica_id?: string | null
          role?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          optica_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_optica_optica_id_fkey"
            columns: ["optica_id"]
            isOneToOne: false
            referencedRelation: "opticas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_signup_insert: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      confirm_admin_email: {
        Args: { admin_email: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
