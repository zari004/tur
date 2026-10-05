import { isDatabaseConfigured, requireSupabase } from './supabase';

export type SellerRow = {
  id: string;
  company_name: string;
  owner_name: string;
  phone: string | null;
  status: 'pending' | 'approved' | 'blocked';
  rating: number;
  created_at: string;
};

export type TourInput = {
  seller_id: string;
  title: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  price_uzs: number;
  description?: string;
};

export async function listSellers() {
  if (!isDatabaseConfigured) return null;
  const { data, error } = await requireSupabase()
    .from('seller_profiles')
    .select('id, company_name, owner_name, phone, status, rating, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as SellerRow[];
}

export async function setSellerStatus(id: string, status: SellerRow['status']) {
  const { error } = await requireSupabase().from('seller_profiles').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function createTour(input: TourInput) {
  const { data, error } = await requireSupabase()
    .from('tours')
    .insert({ ...input, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDashboardCounts() {
  if (!isDatabaseConfigured) return null;
  const db = requireSupabase();
  const [users, sellers, tours, bookings] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('tours').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('bookings').select('*', { count: 'exact', head: true }),
  ]);
  const error = users.error || sellers.error || tours.error || bookings.error;
  if (error) throw error;
  return { users: users.count ?? 0, sellers: sellers.count ?? 0, tours: tours.count ?? 0, bookings: bookings.count ?? 0 };
}
