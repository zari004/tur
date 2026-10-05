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

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: 'user' | 'seller' | 'admin';
};

export type TourRow = {
  id: string;
  seller_id: string;
  title: string;
  destination: string;
  description: string;
  image_url: string | null;
  starts_at: string;
  ends_at: string;
  price_uzs: number;
  capacity: number;
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'archived';
  created_at: string;
};

export async function getCurrentProfile() {
  if (!isDatabaseConfigured) return null;
  const db = requireSupabase();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) return null;
  const { data, error } = await db.from('profiles').select('id, full_name, phone, role').eq('id', auth.user.id).single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function getOwnSellerProfile() {
  if (!isDatabaseConfigured) return null;
  const db = requireSupabase();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await db.from('seller_profiles').select('*').eq('user_id', auth.user.id).maybeSingle();
  if (error) throw error;
  return data as (SellerRow & { user_id: string }) | null;
}

export async function listOwnTours(sellerId: string) {
  const { data, error } = await requireSupabase().from('tours').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as TourRow[];
}

export async function listActiveTours() {
  if (!isDatabaseConfigured) return null;
  const { data, error } = await requireSupabase().from('tours').select('*').eq('status', 'active').order('starts_at').limit(24);
  if (error) throw error;
  return data as TourRow[];
}

export async function removeTour(id: string) {
  const { error } = await requireSupabase().from('tours').delete().eq('id', id);
  if (error) throw error;
}

export async function setTourStatus(id: string, status: TourRow['status'], rejectionReason?: string) {
  const { error } = await requireSupabase().from('tours').update({ status, rejection_reason: rejectionReason ?? null }).eq('id', id);
  if (error) throw error;
}

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
