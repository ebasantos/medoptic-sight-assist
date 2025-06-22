export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
