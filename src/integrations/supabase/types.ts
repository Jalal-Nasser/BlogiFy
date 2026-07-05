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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
        }
        Update: {
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_settings: {
        Row: {
          blog_description: string | null
          blog_name: string
          created_at: string
          default_author_id: string | null
          id: string
          seo_title_pattern: string
          updated_at: string
        }
        Insert: {
          blog_description?: string | null
          blog_name?: string
          created_at?: string
          default_author_id?: string | null
          id?: string
          seo_title_pattern?: string
          updated_at?: string
        }
        Update: {
          blog_description?: string | null
          blog_name?: string
          created_at?: string
          default_author_id?: string | null
          id?: string
          seo_title_pattern?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_settings_default_author_id_fkey"
            columns: ["default_author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          parent_slug: string | null
          slug: string
          status: string
          updated_at: string
          wp_id: number | null
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          parent_slug?: string | null
          slug: string
          status?: string
          updated_at?: string
          wp_id?: number | null
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          parent_slug?: string | null
          slug?: string
          status?: string
          updated_at?: string
          wp_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          post_id: string | null
          title: string | null
          uploaded_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          post_id?: string | null
          title?: string | null
          uploaded_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          post_id?: string | null
          title?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          id: string
          path: string
          post_id: string | null
          referrer: string | null
          visitor_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          path: string
          post_id?: string | null
          referrer?: string | null
          visitor_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          post_id?: string | null
          referrer?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string
          created_at: string
          id: string
          slug: string
          status: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          slug: string
          status?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          slug?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author: string
          author_id: string | null
          canonical_url: string | null
          category_id: string | null
          category_slug: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image_url: string | null
          id: string
          linkedin_post_id: string | null
          linkedin_post_url: string | null
          linkedin_publish_error: string | null
          linkedin_published_at: string | null
          meta_description: string | null
          published_at: string
          published_to_linkedin: boolean
          read_time_minutes: number
          seo_title: string | null
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author?: string
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          category_slug?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          linkedin_post_id?: string | null
          linkedin_post_url?: string | null
          linkedin_publish_error?: string | null
          linkedin_published_at?: string | null
          meta_description?: string | null
          published_at?: string
          published_to_linkedin?: boolean
          read_time_minutes?: number
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author?: string
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          category_slug?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_url?: string | null
          id?: string
          linkedin_post_id?: string | null
          linkedin_post_url?: string | null
          linkedin_publish_error?: string | null
          linkedin_published_at?: string | null
          meta_description?: string | null
          published_at?: string
          published_to_linkedin?: boolean
          read_time_minutes?: number
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audits: {
        Row: {
          checked_at: string
          id: number
          issues: Json
          metadata: Json
          score: number
          url: string
        }
        Insert: {
          checked_at?: string
          id?: number
          issues?: Json
          metadata?: Json
          score?: number
          url: string
        }
        Update: {
          checked_at?: string
          id?: number
          issues?: Json
          metadata?: Json
          score?: number
          url?: string
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          country: string
          created_at: string
          id: number
          keyword: string
          status: string
          target_url: string | null
        }
        Insert: {
          country?: string
          created_at?: string
          id?: number
          keyword: string
          status?: string
          target_url?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          id?: number
          keyword?: string
          status?: string
          target_url?: string | null
        }
        Relationships: []
      }
      seo_rankings: {
        Row: {
          checked_at: string
          id: number
          keyword: string
          keyword_id: number
          position: number | null
          source: string
          title: string | null
          url: string | null
        }
        Insert: {
          checked_at?: string
          id?: number
          keyword: string
          keyword_id: number
          position?: number | null
          source?: string
          title?: string | null
          url?: string | null
        }
        Update: {
          checked_at?: string
          id?: number
          keyword?: string
          keyword_id?: number
          position?: number | null
          source?: string
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_rankings_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "seo_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
