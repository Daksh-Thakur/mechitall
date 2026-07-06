'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export interface Review {
  id: string;
  profile_id: string;
  product_id?: string;
  service_id?: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  likes?: number;
  is_verified_buyer?: boolean;
}

export interface Discussion {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  category: 'General' | 'Build Log' | 'Question' | 'Showcase';
  created_at: string;
  author_name?: string;
  reply_count?: number;
  likes?: number;
  is_verified_buyer?: boolean;
}

/**
 * Submit a product review
 */
export async function submitReview(data: {
  profileId: string;
  productId?: string;
  serviceId?: string;
  rating: number;
  title: string;
  body: string;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: review, error } = await supabase
    .from('reviews')
    .insert([{
      profile_id: data.profileId,
      product_id: data.productId || null,
      service_id: data.serviceId || null,
      rating: data.rating,
      title: data.title,
      body: data.body,
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to submit review: ${error.message}`);
  return review as Review;
}

/**
 * Get reviews for a product or service
 */
export async function getReviews(opts: { productId?: string; serviceId?: string }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from('reviews')
    .select(`*, profiles:profile_id(full_name, is_verified_buyer)`)
    .order('created_at', { ascending: false });

  if (opts.productId) query = query.eq('product_id', opts.productId);
  if (opts.serviceId) query = query.eq('service_id', opts.serviceId);

  const { data, error } = await query;
  if (error) return [];

  return (data || []).map((r: any) => ({
    ...r,
    author_name: r.profiles?.full_name || 'Anonymous',
    author_avatar: (r.profiles?.full_name || 'AN').substring(0, 2).toUpperCase(),
    is_verified_buyer: r.profiles?.is_verified_buyer || false,
  })) as Review[];
}

/**
 * Get all reviews (community page)
 */
export async function getAllReviews() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles:profile_id(full_name, is_verified_buyer)`)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return [];

  return (data || []).map((r: any) => ({
    ...r,
    author_name: r.profiles?.full_name || 'Anonymous',
    author_avatar: (r.profiles?.full_name || 'AN').substring(0, 2).toUpperCase(),
    is_verified_buyer: r.profiles?.is_verified_buyer || false,
  })) as Review[];
}

/**
 * Submit a community discussion post
 */
export async function submitDiscussion(data: {
  profileId: string;
  title: string;
  body: string;
  category: 'General' | 'Build Log' | 'Question' | 'Showcase';
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: discussion, error } = await supabase
    .from('discussions')
    .insert([{
      profile_id: data.profileId,
      title: data.title,
      body: data.body,
      category: data.category,
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to post discussion: ${error.message}`);
  return discussion as Discussion;
}

/**
 * Get community discussions
 */
export async function getDiscussions() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from('discussions')
    .select(`*, profiles:profile_id(full_name, is_verified_buyer)`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];

  return (data || []).map((d: any) => ({
    ...d,
    author_name: d.profiles?.full_name || 'Anonymous',
    is_verified_buyer: d.profiles?.is_verified_buyer || false,
  })) as Discussion[];
}
