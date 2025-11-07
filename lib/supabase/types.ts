export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      allergen_types: {
        Row: {
          id: string;
          key: string;
          name_es: string;
          notes: string | null;
          synonyms: string[] | null;
        };
        Insert: {
          id?: string;
          key: string;
          name_es: string;
          notes?: string | null;
          synonyms?: string[] | null;
        };
        Update: {
          id?: string;
          key?: string;
          name_es?: string;
          notes?: string | null;
          synonyms?: string[] | null;
        };
        Relationships: [];
      };
      app_roles: {
        Row: {
          key: string;
        };
        Insert: {
          key: string;
        };
        Update: {
          key?: string;
        };
        Relationships: [];
      };
      dictionary_changes: {
        Row: {
          action: "insert" | "update" | "delete";
          changed_at: string;
          changed_by: string;
          id: string;
          new_data: Json | null;
          old_data: Json | null;
          row_id: string | null;
          table_name: string;
        };
        Insert: {
          action: "insert" | "update" | "delete";
          changed_at?: string;
          changed_by?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          row_id?: string | null;
          table_name: string;
        };
        Update: {
          action?: "insert" | "update" | "delete";
          changed_at?: string;
          changed_by?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          row_id?: string | null;
          table_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_changes_changed_by_fkey";
            columns: ["changed_by"];
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          }
        ];
      };
      diet_types: {
        Row: {
          description: string | null;
          id: string;
          key: string;
          name_es: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          key: string;
          name_es: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          key?: string;
          name_es?: string;
        };
        Relationships: [];
      };
      intolerance_types: {
        Row: {
          id: string;
          key: string;
          name_es: string;
          notes: string | null;
          synonyms: string[] | null;
        };
        Insert: {
          id?: string;
          key: string;
          name_es: string;
          notes?: string | null;
          synonyms?: string[] | null;
        };
        Update: {
          id?: string;
          key?: string;
          name_es?: string;
          notes?: string | null;
          synonyms?: string[] | null;
        };
        Relationships: [];
      };
      strictness_overrides: {
        Row: {
          allergen_id: string;
          block_same_line: boolean | null;
          block_traces: boolean | null;
          e_numbers_uncertain: "allow" | "warn" | "block" | null;
          notes: string | null;
          residual_protein_ppm: number | null;
          strictness_id: string;
        };
        Insert: {
          allergen_id: string;
          block_same_line?: boolean | null;
          block_traces?: boolean | null;
          e_numbers_uncertain?: "allow" | "warn" | "block" | null;
          notes?: string | null;
          residual_protein_ppm?: number | null;
          strictness_id: string;
        };
        Update: {
          allergen_id?: string;
          block_same_line?: boolean | null;
          block_traces?: boolean | null;
          e_numbers_uncertain?: "allow" | "warn" | "block" | null;
          notes?: string | null;
          residual_protein_ppm?: number | null;
          strictness_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "strictness_overrides_allergen_id_fkey";
            columns: ["allergen_id"];
            referencedRelation: "allergen_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "strictness_overrides_strictness_id_fkey";
            columns: ["strictness_id"];
            referencedRelation: "strictness_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      strictness_profiles: {
        Row: {
          anaphylaxis_mode: boolean;
          block_same_line: boolean;
          block_traces: boolean;
          created_at: string;
          e_numbers_uncertain: "allow" | "warn" | "block";
          id: string;
          min_model_confidence: number;
          name: string;
          pediatric_mode: boolean;
          residual_protein_ppm_default: number;
          updated_at: string;
          user_id: string;
          description: string | null;
        };
        Insert: {
          anaphylaxis_mode?: boolean;
          block_same_line?: boolean;
          block_traces?: boolean;
          created_at?: string;
          description?: string | null;
          e_numbers_uncertain?: "allow" | "warn" | "block";
          id?: string;
          min_model_confidence?: number;
          name: string;
          pediatric_mode?: boolean;
          residual_protein_ppm_default?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          anaphylaxis_mode?: boolean;
          block_same_line?: boolean;
          block_traces?: boolean;
          created_at?: string;
          description?: string | null;
          e_numbers_uncertain?: "allow" | "warn" | "block";
          id?: string;
          min_model_confidence?: number;
          name?: string;
          pediatric_mode?: boolean;
          residual_protein_ppm_default?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "strictness_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_profile_allergens: {
        Row: {
          allergen_id: string;
          notes: string | null;
          severity: number;
          user_id: string;
        };
        Insert: {
          allergen_id: string;
          notes?: string | null;
          severity?: number;
          user_id: string;
        };
        Update: {
          allergen_id?: string;
          notes?: string | null;
          severity?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profile_allergens_allergen_id_fkey";
            columns: ["allergen_id"];
            referencedRelation: "allergen_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_profile_allergens_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_profile_diets: {
        Row: {
          diet_id: string;
          user_id: string;
        };
        Insert: {
          diet_id: string;
          user_id: string;
        };
        Update: {
          diet_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profile_diets_diet_id_fkey";
            columns: ["diet_id"];
            referencedRelation: "diet_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_profile_diets_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_profile_intolerances: {
        Row: {
          intolerance_id: string;
          notes: string | null;
          severity: number;
          user_id: string;
        };
        Insert: {
          intolerance_id: string;
          notes?: string | null;
          severity?: number;
          user_id: string;
        };
        Update: {
          intolerance_id?: string;
          notes?: string | null;
          severity?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profile_intolerances_intolerance_id_fkey";
            columns: ["intolerance_id"];
            referencedRelation: "intolerance_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_profile_intolerances_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          active_strictness_id: string | null;
          created_at: string;
          display_name: string | null;
          notes: string | null;
          onboarding_completed_at: string | null;
          pregnant: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active_strictness_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          notes?: string | null;
          onboarding_completed_at?: string | null;
          pregnant?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active_strictness_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          notes?: string | null;
          onboarding_completed_at?: string | null;
          pregnant?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          role_key: string;
          user_id: string;
        };
        Insert: {
          role_key: string;
          user_id: string;
        };
        Update: {
          role_key?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_key_fkey";
            columns: ["role_key"];
            referencedRelation: "app_roles";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      decide_e_number: {
        Args: {
          p_user_id: string;
          p_code: string;
        };
        Returns: Json;
      };
      get_effective_strictness: {
        Args: {
          p_user_id: string;
          p_allergen_key: string;
        };
        Returns: Json;
      };
      get_profile_payload: {
        Args: {
          p_user_id: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
