import type { OrderItem } from './supabase';

export type SalesSummary = {
  totalRevenue: number; totalOrders: number; avgOrderValue: number; uniqueCustomers: number;
  periodStart: string; periodEnd: string;
  chartData: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ name: string; orders: number; revenue: number }>;
};

export type DashboardSummary = {
  stats: { todayRevenue: number; todayOrders: number; activeCustomers: number; monthlyRevenue: number };
  chartData: Array<{ date: string; revenue: number }>;
  topProducts: Array<{ name: string; orders: number; revenue: number }>;
  recentBills: Array<{ id: string; bill_no: string; customer_name: string; customer_phone: string;
    items: OrderItem[]; total: number; payment_method: string; created_at: string }>;
};
