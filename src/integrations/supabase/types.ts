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
      ai_generation_logs: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          prompt_used: string | null
          result_status: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          prompt_used?: string | null
          result_status?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          prompt_used?: string | null
          result_status?: string | null
        }
        Relationships: []
      }
      apk_management: {
        Row: {
          apk_url: string
          created_at: string | null
          created_by: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          release_notes: string | null
          uploaded_at: string | null
          version: string
        }
        Insert: {
          apk_url: string
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          release_notes?: string | null
          uploaded_at?: string | null
          version: string
        }
        Update: {
          apk_url?: string
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          release_notes?: string | null
          uploaded_at?: string | null
          version?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          secondary_button_link: string | null
          secondary_button_text: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          section_banner_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          section_banner_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          section_banner_url?: string | null
          slug?: string
          updated_at?: string
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
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string
          id: string
          order_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_product_ids: string[] | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          per_user_limit: number | null
          type: string
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          applicable_product_ids?: string[] | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          per_user_limit?: number | null
          type?: string
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Update: {
          applicable_product_ids?: string[] | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          per_user_limit?: number | null
          type?: string
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          provider_id: string | null
          recipient: string
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          recipient: string
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: string | null
          recipient?: string
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          notes: string | null
          updated_at: string
          voucher_url: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          updated_at?: string
          voucher_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          updated_at?: string
          voucher_url?: string | null
        }
        Relationships: []
      }
      finance_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          investment_date: string
          investor_name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          investment_date?: string
          investor_name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          investment_date?: string
          investor_name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      latest_showcase: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          product_link: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          product_link?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          product_link?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          last_updated: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          last_updated?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          last_updated?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          enabled: boolean | null
          id: string
          key: string
          updated_at: string | null
        }
        Insert: {
          enabled?: boolean | null
          id?: string
          key: string
          updated_at?: string | null
        }
        Update: {
          enabled?: boolean | null
          id?: string
          key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          message: string
          target_url: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message: string
          target_url?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          message?: string
          target_url?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          selected_color: string | null
          selected_size: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          product_image?: string | null
          product_name: string
          quantity: number
          selected_color?: string | null
          selected_size?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string
          coupon_code: string | null
          courier_name: string | null
          courier_status: string | null
          created_at: string
          delivery_area: string
          discount_amount: number | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          payment_method: string
          phone: string
          shipping_cost: number
          status: string
          total_amount: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          city: string
          coupon_code?: string | null
          courier_name?: string | null
          courier_status?: string | null
          created_at?: string
          delivery_area?: string
          discount_amount?: number | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          payment_method?: string
          phone: string
          shipping_cost?: number
          status?: string
          total_amount: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string
          coupon_code?: string | null
          courier_name?: string | null
          courier_status?: string | null
          created_at?: string
          delivery_area?: string
          discount_amount?: number | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          payment_method?: string
          phone?: string
          shipping_cost?: number
          status?: string
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      page_contents: {
        Row: {
          content: string
          created_at: string
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_layouts: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          published_at: string | null
          sections: Json
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          sections?: Json
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          published_at?: string | null
          sections?: Json
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          color_hex: string | null
          created_at: string
          display_order: number
          id: string
          image_urls: string[] | null
          price: number | null
          product_id: string
          sale_price: number | null
          stock_quantity: number
          updated_at: string
          value: string
          variant_type: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_urls?: string[] | null
          price?: number | null
          product_id: string
          sale_price?: number | null
          stock_quantity?: number
          updated_at?: string
          value: string
          variant_type: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_urls?: string[] | null
          price?: number | null
          product_id?: string
          sale_price?: number | null
          stock_quantity?: number
          updated_at?: string
          value?: string
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_analysis: Json | null
          badge_color: string | null
          badge_text: string | null
          badge_type: string | null
          care_info: string | null
          care_instructions: string | null
          category_id: string | null
          colors: string[] | null
          created_at: string
          delivery_info: string | null
          description: string | null
          discount: number | null
          display_order: number
          enable_colors: boolean
          enable_sizes: boolean
          enable_volumes: boolean
          features: string[] | null
          highlights: string[] | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          low_stock_threshold: number
          meta_description: string | null
          meta_title: string | null
          name: string
          original_price: number | null
          price: number
          return_policy: string | null
          seo_keywords: string[] | null
          sizes: string[] | null
          sku: string | null
          stock_quantity: number
          supplementary_images: string[] | null
          updated_at: string
        }
        Insert: {
          ai_analysis?: Json | null
          badge_color?: string | null
          badge_text?: string | null
          badge_type?: string | null
          care_info?: string | null
          care_instructions?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          discount?: number | null
          display_order?: number
          enable_colors?: boolean
          enable_sizes?: boolean
          enable_volumes?: boolean
          features?: string[] | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          low_stock_threshold?: number
          meta_description?: string | null
          meta_title?: string | null
          name: string
          original_price?: number | null
          price: number
          return_policy?: string | null
          seo_keywords?: string[] | null
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number
          supplementary_images?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_analysis?: Json | null
          badge_color?: string | null
          badge_text?: string | null
          badge_type?: string | null
          care_info?: string | null
          care_instructions?: string | null
          category_id?: string | null
          colors?: string[] | null
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          discount?: number | null
          display_order?: number
          enable_colors?: boolean
          enable_sizes?: boolean
          enable_volumes?: boolean
          features?: string[] | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          low_stock_threshold?: number
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          original_price?: number | null
          price?: number
          return_policy?: string | null
          seo_keywords?: string[] | null
          sizes?: string[] | null
          sku?: string | null
          stock_quantity?: number
          supplementary_images?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          subscription_data: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          subscription_data: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          subscription_data?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          loader_logo_url: string | null
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          loader_logo_url?: string | null
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          loader_logo_url?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          change_qty: number
          changed_by: string | null
          created_at: string
          id: string
          new_qty: number
          previous_qty: number
          product_id: string
          reason: string | null
          variant_id: string | null
        }
        Insert: {
          change_qty: number
          changed_by?: string | null
          created_at?: string
          id?: string
          new_qty: number
          previous_qty: number
          product_id: string
          reason?: string | null
          variant_id?: string | null
        }
        Update: {
          change_qty?: number
          changed_by?: string | null
          created_at?: string
          id?: string
          new_qty?: number
          previous_qty?: number
          product_id?: string
          reason?: string | null
          variant_id?: string | null
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
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_role_by_email: { Args: { _email: string }; Returns: string }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          phone: string
          provider: string
          role: string
          role_granted_at: string
        }[]
      }
      admin_remove_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
