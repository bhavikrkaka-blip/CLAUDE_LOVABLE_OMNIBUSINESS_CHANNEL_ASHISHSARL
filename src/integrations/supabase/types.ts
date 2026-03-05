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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          button_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          placement: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          placement: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          placement?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_abandonment: {
        Row: {
          added_at: string
          converted: boolean | null
          converted_at: string | null
          id: string
          order_id: string | null
          product_id: string
          quantity: number | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          added_at?: string
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          quantity?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          added_at?: string
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          quantity?: number | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_abandonment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_abandonment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      click_events: {
        Row: {
          created_at: string
          device_type: string | null
          element_id: string
          element_label: string | null
          element_type: string
          id: string
          page_path: string
          referrer: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          element_id: string
          element_label?: string | null
          element_type: string
          id?: string
          page_path: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          element_id?: string
          element_label?: string | null
          element_type?: string
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      featured_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          placement: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          placement?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          placement?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          location_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      liked_products: {
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
        Relationships: [
          {
            foreignKeyName: "liked_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["location_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["location_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["location_type"]
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string
          shipping_address: string | null
          shipping_city: string | null
          shipping_phone: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_phone?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_phone?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_analytics: {
        Row: {
          add_to_cart_count: number | null
          click_count: number | null
          id: string
          last_purchased_at: string | null
          last_viewed_at: string | null
          product_id: string
          purchase_count: number | null
          total_revenue: number | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          add_to_cart_count?: number | null
          click_count?: number | null
          id?: string
          last_purchased_at?: string | null
          last_viewed_at?: string | null
          product_id: string
          purchase_count?: number | null
          total_revenue?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          add_to_cart_count?: number | null
          click_count?: number | null
          id?: string
          last_purchased_at?: string | null
          last_viewed_at?: string | null
          product_id?: string
          purchase_count?: number | null
          total_revenue?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          session_id: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          session_id?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          // Ecommerce fields
          brand: string
          category: string
          created_at: string
          description: string | null
          description_fr: string | null
          features: string[] | null
          features_fr: string[] | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          is_new: boolean | null
          name: string
          name_fr: string | null
          original_price: number | null
          price: number
          updated_at: string
          // ERP fields (merged from products_master)
          barcode: string | null
          cost_price: number
          duplicate_override_reason: string | null
          image_embedding: string | null
          is_active: boolean
          main_image_path: string | null
          reorder_level: number
          retail_price: number
          sku: string | null
          text_embedding: string | null
          wholesale_price: number
        }
        Insert: {
          brand: string
          category: string
          created_at?: string
          description?: string | null
          description_fr?: string | null
          features?: string[] | null
          features_fr?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_new?: boolean | null
          name: string
          name_fr?: string | null
          original_price?: number | null
          price: number
          updated_at?: string
          barcode?: string | null
          cost_price?: number
          duplicate_override_reason?: string | null
          image_embedding?: string | null
          is_active?: boolean
          main_image_path?: string | null
          reorder_level?: number
          retail_price?: number
          sku?: string | null
          text_embedding?: string | null
          wholesale_price?: number
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          description?: string | null
          description_fr?: string | null
          features?: string[] | null
          features_fr?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_new?: boolean | null
          name?: string
          name_fr?: string | null
          original_price?: number | null
          price?: number
          updated_at?: string
          barcode?: string | null
          cost_price?: number
          duplicate_override_reason?: string | null
          image_embedding?: string | null
          is_active?: boolean
          main_image_path?: string | null
          reorder_level?: number
          retail_price?: number
          sku?: string | null
          text_embedding?: string | null
          wholesale_price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          product_id: string
          purchase_id: string
          quantity: number
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          id?: string
          product_id: string
          purchase_id: string
          quantity: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          product_id?: string
          purchase_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          id: string
          invoice_number: string
          purchase_date: string
          supplier_id: string
          total_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number: string
          purchase_date: string
          supplier_id: string
          total_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string
          purchase_date?: string
          supplier_id?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_price: number
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          selling_price: number
        }
        Insert: {
          cost_price: number
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          selling_price: number
        }
        Update: {
          cost_price?: number
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          selling_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_name: string | null
          gross_profit: number
          id: string
          invoice_number: string
          narration: string | null
          payment_method: string
          replaced_by_sale_id: string | null
          sale_date: string
          status: string
          store_id: string
          total_amount: number
          total_cost: number
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          gross_profit?: number
          id?: string
          invoice_number: string
          narration?: string | null
          payment_method: string
          replaced_by_sale_id?: string | null
          sale_date: string
          status?: string
          store_id: string
          total_amount?: number
          total_cost?: number
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          gross_profit?: number
          id?: string
          invoice_number?: string
          narration?: string | null
          payment_method?: string
          replaced_by_sale_id?: string | null
          sale_date?: string
          status?: string
          store_id?: string
          total_amount?: number
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_replaced_by_sale_id_fkey"
            columns: ["replaced_by_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_audit_log: {
        Row: {
          action_type: string
          edited_at: string
          edited_by: string
          id: string
          new_sale_snapshot: Json | null
          previous_sale_snapshot: Json
          reason: string | null
          sale_id: string
        }
        Insert: {
          action_type?: string
          edited_at?: string
          edited_by: string
          id?: string
          new_sale_snapshot?: Json | null
          previous_sale_snapshot: Json
          reason?: string | null
          sale_id: string
        }
        Update: {
          action_type?: string
          edited_at?: string
          edited_by?: string
          id?: string
          new_sale_snapshot?: Json | null
          previous_sale_snapshot?: Json
          reason?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_audit_log_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          from_location_id: string | null
          id: string
          is_negative_warning: boolean
          movement_type: Database["public"]["Enums"]["movement_type"]
          product_id: string
          quantity: number
          reference_id: string | null
          to_location_id: string | null
        }
        Insert: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          is_negative_warning?: boolean
          movement_type: Database["public"]["Enums"]["movement_type"]
          product_id: string
          quantity: number
          reference_id?: string | null
          to_location_id?: string | null
        }
        Update: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          is_negative_warning?: boolean
          movement_type?: Database["public"]["Enums"]["movement_type"]
          product_id?: string
          quantity?: number
          reference_id?: string | null
          to_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          id: string
          name: string
          cities: string[]
          base_fee: number
          estimated_days: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          cities?: string[]
          base_fee?: number
          estimated_days?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          cities?: string[]
          base_fee?: number
          estimated_days?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          id: string
          name: string
          scope: string
          product_ids: string[] | null
          category: string | null
          discount_percent: number | null
          discount_amount: number | null
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          scope?: string
          product_ids?: string[] | null
          category?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          scope?: string
          product_ids?: string[] | null
          category?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_percent: number | null
          discount_amount: number | null
          min_order_amount: number
          max_uses: number | null
          uses_count: number
          valid_from: string
          valid_until: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          min_order_amount?: number
          max_uses?: number | null
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_percent?: number | null
          discount_amount?: number | null
          min_order_amount?: number
          max_uses?: number | null
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          code: string
          name: string
          type: string
          parent_id: string | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          type: string
          parent_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          type?: string
          parent_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          id: string
          date: string
          reference: string | null
          description: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          reference?: string | null
          description: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          reference?: string | null
          description?: string
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          id: string
          entry_id: string
          account_id: string
          debit: number
          credit: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          account_id: string
          debit?: number
          credit?: number
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          account_id?: string
          debit?: number
          credit?: number
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          allow_negative_stock: boolean
          created_at: string
          fb_pixel_enabled: boolean
          fb_pixel_id: string | null
          ga4_measurement_id: string | null
          id: string
        }
        Insert: {
          allow_negative_stock?: boolean
          created_at?: string
          fb_pixel_enabled?: boolean
          fb_pixel_id?: string | null
          ga4_measurement_id?: string | null
          id?: string
        }
        Update: {
          allow_negative_stock?: boolean
          created_at?: string
          fb_pixel_enabled?: boolean
          fb_pixel_id?: string | null
          ga4_measurement_id?: string | null
          id?: string
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
      visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          first_visit_at: string
          id: string
          landing_page: string | null
          last_activity_at: string
          os: string | null
          page_views: number | null
          referrer: string | null
          session_id: string
          source: string
          total_clicks: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          first_visit_at?: string
          id?: string
          landing_page?: string | null
          last_activity_at?: string
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          session_id: string
          source?: string
          total_clicks?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          first_visit_at?: string
          id?: string
          landing_page?: string | null
          last_activity_at?: string
          os?: string | null
          page_views?: number | null
          referrer?: string | null
          session_id?: string
          source?: string
          total_clicks?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
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
      process_purchase: {
        Args: {
          p_invoice_number: string
          p_items: Json
          p_purchase_date: string
          p_supplier_id: string
          p_warehouse_id: string
        }
        Returns: Json
      }
      process_sale: {
        Args: {
          p_invoice_number: string
          p_items: Json
          p_payment_method: string
          p_sale_date: string
          p_store_id: string
        }
        Returns: Json
      }
      process_stock_audit: {
        Args: { p_items: Json; p_location_id: string; p_reference: string }
        Returns: Json
      }
      reverse_sale_stock: { Args: { p_sale_id: string }; Returns: undefined }
      search_products_by_image: {
        Args: { query_vector: string; result_limit?: number }
        Returns: {
          brand: string
          category: string
          description: string
          id: string
          name: string
          retail_price: number
          score: number
          sku: string
        }[]
      }
      search_products_by_text: {
        Args: {
          query_vector: string
          result_limit?: number
          search_text: string
        }
        Returns: {
          brand: string
          category: string
          description: string
          id: string
          name: string
          retail_price: number
          score: number
          sku: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin" | "pos_operator"
      location_type: "warehouse" | "store"
      movement_type: "purchase" | "sale" | "transfer" | "adjustment" | "return"
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
      app_role: ["admin", "user", "super_admin", "pos_operator"],
      location_type: ["warehouse", "store"],
      movement_type: ["purchase", "sale", "transfer", "adjustment", "return"],
    },
  },
} as const
