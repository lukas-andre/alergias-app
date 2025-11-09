export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allergen_synonyms: {
        Row: {
          allergen_id: string
          created_at: string
          id: string
          locale: string
          surface: string
          weight: number
        }
        Insert: {
          allergen_id: string
          created_at?: string
          id?: string
          locale?: string
          surface: string
          weight?: number
        }
        Update: {
          allergen_id?: string
          created_at?: string
          id?: string
          locale?: string
          surface?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "allergen_synonyms_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergen_types"
            referencedColumns: ["id"]
          },
        ]
      }
      allergen_types: {
        Row: {
          id: string
          key: string
          name_es: string
          notes: string | null
          synonyms: string[] | null
        }
        Insert: {
          id?: string
          key: string
          name_es: string
          notes?: string | null
          synonyms?: string[] | null
        }
        Update: {
          id?: string
          key?: string
          name_es?: string
          notes?: string | null
          synonyms?: string[] | null
        }
        Relationships: []
      }
      app_roles: {
        Row: {
          key: string
        }
        Insert: {
          key: string
        }
        Update: {
          key?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      dictionary_changes: {
        Row: {
          action: string
          changed_at: string
          changed_by: string
          id: string
          new_data: Json | null
          old_data: Json | null
          row_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      diet_types: {
        Row: {
          description: string | null
          id: string
          key: string
          name_es: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          name_es: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          name_es?: string
        }
        Relationships: []
      }
      e_numbers: {
        Row: {
          code: string
          created_at: string
          likely_origins: string[]
          linked_allergen_keys: string[]
          name_es: string
          notes: string | null
          residual_protein_risk: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          likely_origins?: string[]
          linked_allergen_keys?: string[]
          name_es: string
          notes?: string | null
          residual_protein_risk?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          likely_origins?: string[]
          linked_allergen_keys?: string[]
          name_es?: string
          notes?: string | null
          residual_protein_risk?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      extraction_tokens: {
        Row: {
          allergen_id: string | null
          canonical: string | null
          confidence: number | null
          created_at: string
          e_code: string | null
          extraction_id: string
          id: string
          span: unknown
          surface: string
          type: string
        }
        Insert: {
          allergen_id?: string | null
          canonical?: string | null
          confidence?: number | null
          created_at?: string
          e_code?: string | null
          extraction_id: string
          id?: string
          span?: unknown
          surface: string
          type: string
        }
        Update: {
          allergen_id?: string | null
          canonical?: string | null
          confidence?: number | null
          created_at?: string
          e_code?: string | null
          extraction_id?: string
          id?: string
          span?: unknown
          surface?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_tokens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergen_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_tokens_e_code_fkey"
            columns: ["e_code"]
            isOneToOne: false
            referencedRelation: "e_numbers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "extraction_tokens_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      extractions: {
        Row: {
          created_at: string
          final_confidence: number | null
          id: string
          image_base64: string | null
          label_hash: string | null
          model_confidence: number | null
          ocr_confidence: number | null
          origin: string
          raw_json: Json | null
          raw_text: string | null
          source_ref: string | null
          updated_at: string
          user_id: string
          vision_confidence: number | null
        }
        Insert: {
          created_at?: string
          final_confidence?: number | null
          id?: string
          image_base64?: string | null
          label_hash?: string | null
          model_confidence?: number | null
          ocr_confidence?: number | null
          origin: string
          raw_json?: Json | null
          raw_text?: string | null
          source_ref?: string | null
          updated_at?: string
          user_id: string
          vision_confidence?: number | null
        }
        Update: {
          created_at?: string
          final_confidence?: number | null
          id?: string
          image_base64?: string | null
          label_hash?: string | null
          model_confidence?: number | null
          ocr_confidence?: number | null
          origin?: string
          raw_json?: Json | null
          raw_text?: string | null
          source_ref?: string | null
          updated_at?: string
          user_id?: string
          vision_confidence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extractions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      intolerance_types: {
        Row: {
          id: string
          key: string
          name_es: string
          notes: string | null
          synonyms: string[] | null
        }
        Insert: {
          id?: string
          key: string
          name_es: string
          notes?: string | null
          synonyms?: string[] | null
        }
        Update: {
          id?: string
          key?: string
          name_es?: string
          notes?: string | null
          synonyms?: string[] | null
        }
        Relationships: []
      }
      strictness_overrides: {
        Row: {
          allergen_id: string
          block_same_line: boolean | null
          block_traces: boolean | null
          e_numbers_uncertain: string | null
          notes: string | null
          residual_protein_ppm: number | null
          strictness_id: string
        }
        Insert: {
          allergen_id: string
          block_same_line?: boolean | null
          block_traces?: boolean | null
          e_numbers_uncertain?: string | null
          notes?: string | null
          residual_protein_ppm?: number | null
          strictness_id: string
        }
        Update: {
          allergen_id?: string
          block_same_line?: boolean | null
          block_traces?: boolean | null
          e_numbers_uncertain?: string | null
          notes?: string | null
          residual_protein_ppm?: number | null
          strictness_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strictness_overrides_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergen_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strictness_overrides_strictness_id_fkey"
            columns: ["strictness_id"]
            isOneToOne: false
            referencedRelation: "strictness_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strictness_profiles: {
        Row: {
          anaphylaxis_mode: boolean
          block_same_line: boolean
          block_traces: boolean
          created_at: string
          description: string | null
          e_numbers_uncertain: string
          id: string
          min_model_confidence: number
          name: string
          pediatric_mode: boolean
          residual_protein_ppm_default: number
          updated_at: string
          user_id: string
        }
        Insert: {
          anaphylaxis_mode?: boolean
          block_same_line?: boolean
          block_traces?: boolean
          created_at?: string
          description?: string | null
          e_numbers_uncertain?: string
          id?: string
          min_model_confidence?: number
          name: string
          pediatric_mode?: boolean
          residual_protein_ppm_default?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          anaphylaxis_mode?: boolean
          block_same_line?: boolean
          block_traces?: boolean
          created_at?: string
          description?: string | null
          e_numbers_uncertain?: string
          id?: string
          min_model_confidence?: number
          name?: string
          pediatric_mode?: boolean
          residual_protein_ppm_default?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strictness_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profile_allergens: {
        Row: {
          allergen_id: string
          notes: string | null
          severity: number
          user_id: string
        }
        Insert: {
          allergen_id: string
          notes?: string | null
          severity?: number
          user_id: string
        }
        Update: {
          allergen_id?: string
          notes?: string | null
          severity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergen_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profile_allergens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profile_diets: {
        Row: {
          diet_id: string
          user_id: string
        }
        Insert: {
          diet_id: string
          user_id: string
        }
        Update: {
          diet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_diets_diet_id_fkey"
            columns: ["diet_id"]
            isOneToOne: false
            referencedRelation: "diet_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profile_diets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profile_intolerances: {
        Row: {
          intolerance_id: string
          notes: string | null
          severity: number
          user_id: string
        }
        Insert: {
          intolerance_id: string
          notes?: string | null
          severity?: number
          user_id: string
        }
        Update: {
          intolerance_id?: string
          notes?: string | null
          severity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_intolerances_intolerance_id_fkey"
            columns: ["intolerance_id"]
            isOneToOne: false
            referencedRelation: "intolerance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profile_intolerances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active_strictness_id: string | null
          created_at: string
          display_name: string | null
          notes: string | null
          onboarding_completed_at: string | null
          pregnant: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          active_strictness_id?: string | null
          created_at?: string
          display_name?: string | null
          notes?: string | null
          onboarding_completed_at?: string | null
          pregnant?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          active_strictness_id?: string | null
          created_at?: string
          display_name?: string | null
          notes?: string | null
          onboarding_completed_at?: string | null
          pregnant?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role_key: string
          user_id: string
        }
        Insert: {
          role_key: string
          user_id: string
        }
        Update: {
          role_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_key_fkey"
            columns: ["role_key"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["key"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decide_e_number: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      get_effective_strictness: {
        Args: { p_allergen_key: string; p_user_id: string }
        Returns: Json
      }
      get_effective_strictness_map: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_my_profile_payload: { Args: Record<PropertyKey, never>; Returns: Json }
      get_profile_payload: { Args: { p_user_id: string }; Returns: Json }
      has_role: { Args: { p_role_key: string }; Returns: boolean }
      is_admin: { Args: { uid: string }; Returns: boolean }
      show_limit: { Args: Record<PropertyKey, never>; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
