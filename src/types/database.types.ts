// Supabase CLI로 자동 생성됩니다: npm run db:generate
// 수동 타입 정의 (마이그레이션 전 임시)

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
      organizations: {
        Row: {
          id: string
          org_code: string
          org_type: 'buyer' | 'manager' | 'supplier'
          name_ko: string
          name_en: string | null
          name_ru: string | null
          region: string | null
          region_code: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          country: string | null
          business_number: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_code: string
          org_type: 'buyer' | 'manager' | 'supplier'
          name_ko: string
          name_en?: string | null
          name_ru?: string | null
          region?: string | null
          region_code?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          country?: string | null
          business_number?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_code?: string
          org_type?: 'buyer' | 'manager' | 'supplier'
          name_ko?: string
          name_en?: string | null
          name_ru?: string | null
          region?: string | null
          region_code?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          country?: string | null
          business_number?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          name: string
          phone: string | null
          role: 'buyer' | 'manager' | 'supplier' | 'admin'
          permission_level: number
          is_active: boolean
          last_login_at: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          name: string
          phone?: string | null
          role: 'buyer' | 'manager' | 'supplier' | 'admin'
          permission_level?: number
          is_active?: boolean
          last_login_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          name?: string
          phone?: string | null
          role?: 'buyer' | 'manager' | 'supplier' | 'admin'
          permission_level?: number
          is_active?: boolean
          last_login_at?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          brand_code: string
          name_ko: string
          name_en: string | null
          name_ru: string | null
          description: string | null
          logo_url: string | null
          website_url: string | null
          display_order: number
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_code: string
          name_ko: string
          name_en?: string | null
          name_ru?: string | null
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          display_order?: number
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_code?: string
          name_ko?: string
          name_en?: string | null
          name_ru?: string | null
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          display_order?: number
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          category_code: string
          name_ko: string
          name_en: string | null
          name_ru: string | null
          parent_id: string | null
          level: number
          path: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_code: string
          name_ko: string
          name_en?: string | null
          name_ru?: string | null
          parent_id?: string | null
          level?: number
          path?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_code?: string
          name_ko?: string
          name_en?: string | null
          name_ru?: string | null
          parent_id?: string | null
          level?: number
          path?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          product_code: string
          barcode: string | null
          name_ko: string
          name_en: string | null
          name_ru: string | null
          brand_id: string | null
          category_id: string | null
          volume: string | null
          volume_value: number | null
          volume_unit: string | null
          pcs_per_carton: number
          carton_weight: number | null
          carton_dimensions: string | null
          unit_weight: number | null
          unit_dimensions: string | null
          base_price_krw: number
          base_price_usd: number | null
          price_effective_from: string
          price_effective_to: string | null
          is_exclusive: boolean
          exclusive_buyer_id: string | null
          moq: number
          commitment_unit: number
          status: string
          metadata: Json
          remarks: string | null
          internal_notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          product_code: string
          barcode?: string | null
          name_ko: string
          name_en?: string | null
          name_ru?: string | null
          brand_id?: string | null
          category_id?: string | null
          volume?: string | null
          volume_value?: number | null
          volume_unit?: string | null
          pcs_per_carton?: number
          carton_weight?: number | null
          carton_dimensions?: string | null
          unit_weight?: number | null
          unit_dimensions?: string | null
          base_price_krw?: number
          base_price_usd?: number | null
          price_effective_from?: string
          price_effective_to?: string | null
          is_exclusive?: boolean
          exclusive_buyer_id?: string | null
          moq?: number
          commitment_unit?: number
          status?: string
          metadata?: Json
          remarks?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          product_code?: string
          barcode?: string | null
          name_ko?: string
          name_en?: string | null
          name_ru?: string | null
          brand_id?: string | null
          category_id?: string | null
          volume?: string | null
          volume_value?: number | null
          volume_unit?: string | null
          pcs_per_carton?: number
          carton_weight?: number | null
          carton_dimensions?: string | null
          unit_weight?: number | null
          unit_dimensions?: string | null
          base_price_krw?: number
          base_price_usd?: number | null
          price_effective_from?: string
          price_effective_to?: string | null
          is_exclusive?: boolean
          exclusive_buyer_id?: string | null
          moq?: number
          commitment_unit?: number
          status?: string
          metadata?: Json
          remarks?: string | null
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          buyer_org_id: string
          order_date: string
          requested_delivery_date: string | null
          confirmed_delivery_date: string | null
          status: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'STOCK_CHECK' | 'ADJUSTING' | 'CONFIRMED' | 'PACKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
          edit_permission_buyer: boolean
          edit_permission_manager: boolean
          total_base_amount: number
          total_commission: number
          total_final_amount: number
          total_quantity: number
          total_cartons: number
          exchange_rate_usd: number | null
          exchange_rate_date: string | null
          submitted_at: string | null
          confirmed_at: string | null
          packed_at: string | null
          shipped_at: string | null
          delivered_at: string | null
          completed_at: string | null
          cancelled_at: string | null
          buyer_remarks: string | null
          manager_remarks: string | null
          supplier_remarks: string | null
          cancellation_reason: string | null
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          order_number?: string
          buyer_org_id: string
          order_date?: string
          requested_delivery_date?: string | null
          confirmed_delivery_date?: string | null
          status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'STOCK_CHECK' | 'ADJUSTING' | 'CONFIRMED' | 'PACKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
          edit_permission_buyer?: boolean
          edit_permission_manager?: boolean
          total_base_amount?: number
          total_commission?: number
          total_final_amount?: number
          total_quantity?: number
          total_cartons?: number
          exchange_rate_usd?: number | null
          exchange_rate_date?: string | null
          submitted_at?: string | null
          confirmed_at?: string | null
          packed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          buyer_remarks?: string | null
          manager_remarks?: string | null
          supplier_remarks?: string | null
          cancellation_reason?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          order_number?: string
          buyer_org_id?: string
          order_date?: string
          requested_delivery_date?: string | null
          confirmed_delivery_date?: string | null
          status?: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'STOCK_CHECK' | 'ADJUSTING' | 'CONFIRMED' | 'PACKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
          edit_permission_buyer?: boolean
          edit_permission_manager?: boolean
          total_base_amount?: number
          total_commission?: number
          total_final_amount?: number
          total_quantity?: number
          total_cartons?: number
          exchange_rate_usd?: number | null
          exchange_rate_date?: string | null
          submitted_at?: string | null
          confirmed_at?: string | null
          packed_at?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          buyer_remarks?: string | null
          manager_remarks?: string | null
          supplier_remarks?: string | null
          cancellation_reason?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          requested_quantity: number
          confirmed_quantity: number | null
          shipped_quantity: number | null
          carton_count: number | null
          base_price: number
          commission: number
          final_price: number
          subtotal_base: number | null
          subtotal_commission: number | null
          subtotal_final: number | null
          allocated_lot_id: string | null
          expiry_status: string
          expiry_note: string | null
          remarks: string | null
          line_number: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          requested_quantity: number
          confirmed_quantity?: number | null
          shipped_quantity?: number | null
          carton_count?: number | null
          base_price: number
          commission?: number
          final_price: number
          subtotal_base?: number | null
          subtotal_commission?: number | null
          subtotal_final?: number | null
          allocated_lot_id?: string | null
          expiry_status?: string
          expiry_note?: string | null
          remarks?: string | null
          line_number?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          requested_quantity?: number
          confirmed_quantity?: number | null
          shipped_quantity?: number | null
          carton_count?: number | null
          base_price?: number
          commission?: number
          final_price?: number
          subtotal_base?: number | null
          subtotal_commission?: number | null
          subtotal_final?: number | null
          allocated_lot_id?: string | null
          expiry_status?: string
          expiry_note?: string | null
          remarks?: string | null
          line_number?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      inventory_lots: {
        Row: {
          id: string
          product_id: string
          lot_number: string
          initial_quantity: number
          current_quantity: number
          reserved_quantity: number
          shipped_quantity: number
          manufactured_date: string | null
          expiry_date: string
          received_date: string
          status: string
          location: string | null
          remarks: string | null
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          product_id: string
          lot_number: string
          initial_quantity: number
          current_quantity: number
          reserved_quantity?: number
          shipped_quantity?: number
          manufactured_date?: string | null
          expiry_date: string
          received_date?: string
          status?: string
          location?: string | null
          remarks?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          lot_number?: string
          initial_quantity?: number
          current_quantity?: number
          reserved_quantity?: number
          shipped_quantity?: number
          manufactured_date?: string | null
          expiry_date?: string
          received_date?: string
          status?: string
          location?: string | null
          remarks?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: {
          p_region_code: string
          p_year?: number
        }
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      order_status: 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'STOCK_CHECK' | 'ADJUSTING' | 'CONFIRMED' | 'PACKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 헬퍼 타입
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// 자주 사용하는 타입 별칭
export type Organization = Tables<'organizations'>
export type User = Tables<'users'>
export type Brand = Tables<'brands'>
export type Category = Tables<'categories'>
export type Product = Tables<'products'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type InventoryLot = Tables<'inventory_lots'>
export type OrderStatus = Enums<'order_status'>
