// Generated from the live schema via the Supabase MCP (generate_typescript_types).
// Regenerate after any migration: supabase gen types typescript --project-id mjmdevbdqhfwmdfebwfv

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      media: {
        Row: {
          alt_en: string
          alt_he: string
          created_at: string
          focal_x: number
          focal_y: number
          id: string
          is_cover: boolean
          kind: string
          path_large: string | null
          path_medium: string | null
          path_poster: string | null
          path_thumbnail: string | null
          path_video: string | null
          piece_id: string
          sort_order: number
        }
        Insert: {
          alt_en?: string
          alt_he?: string
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          is_cover?: boolean
          kind: string
          path_large?: string | null
          path_medium?: string | null
          path_poster?: string | null
          path_thumbnail?: string | null
          path_video?: string | null
          piece_id: string
          sort_order?: number
        }
        Update: {
          alt_en?: string
          alt_he?: string
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          is_cover?: boolean
          kind?: string
          path_large?: string | null
          path_medium?: string | null
          path_poster?: string | null
          path_thumbnail?: string | null
          path_video?: string | null
          piece_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'media_piece_id_fkey'
            columns: ['piece_id']
            isOneToOne: false
            referencedRelation: 'pieces'
            referencedColumns: ['id']
          },
        ]
      }
      pieces: {
        Row: {
          created_at: string
          description_en: string
          description_he: string
          id: string
          is_draft: boolean
          materials_en: string
          materials_he: string
          name_en: string
          name_he: string
          price: number | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string
          description_he?: string
          id?: string
          is_draft?: boolean
          materials_en?: string
          materials_he?: string
          name_en?: string
          name_he?: string
          price?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string
          description_he?: string
          id?: string
          is_draft?: boolean
          materials_en?: string
          materials_he?: string
          name_en?: string
          name_he?: string
          price?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          hero_kind: string
          hero_path_image: string | null
          hero_path_poster: string | null
          hero_path_video: string | null
          id: boolean
          updated_at: string
        }
        Insert: {
          hero_kind?: string
          hero_path_image?: string | null
          hero_path_poster?: string | null
          hero_path_video?: string | null
          id?: boolean
          updated_at?: string
        }
        Update: {
          hero_kind?: string
          hero_path_image?: string | null
          hero_path_poster?: string | null
          hero_path_video?: string | null
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
