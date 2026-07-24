import { createClient } from "@supabase/supabase-js";

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  try {
    new URL(url);
    if (!url.startsWith('http')) throw new Error('Must start with http');
    return url;
  } catch (e) {
    return 'https://placeholder.supabase.co';
  }
};

export const supabase = createClient(
  getSupabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: string;
          price: number;
          image: string | null;
          description: string | null;
          stock: number;
          barcode: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          birthday: string | null;
          loyalty_points: number;
          total_purchase: number;
          last_visit: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string;
          items: OrderItem[];
          subtotal: number;
          discount: number;
          gst: number;
          total: number;
          payment_method: "cash" | "upi" | "card" | "split";
          bill_no: string;
          status: "pending" | "completed" | "cancelled";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      staff: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          role: "admin" | "manager" | "cashier";
          status: "active" | "inactive";
          avatar: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["staff"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
      };
      franchise_applications: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          city: string;
          budget: string;
          experience: string;
          message: string | null;
          status: "pending" | "reviewing" | "approved" | "rejected";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["franchise_applications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["franchise_applications"]["Insert"]>;
      };
      gallery: {
        Row: {
          id: string;
          image_url: string;
          caption: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["gallery"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["gallery"]["Insert"]>;
      };
      offers: {
        Row: {
          id: string;
          title: string;
          description: string;
          image: string | null;
          discount_percent: number | null;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["offers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          type: "info" | "success" | "warning" | "offer";
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      store_locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          phone: string;
          hours: string;
          lat: number | null;
          lng: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["store_locations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["store_locations"]["Insert"]>;
      };
    };
  };
};

export type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  total: number;
};
