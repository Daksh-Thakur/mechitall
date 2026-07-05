'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export interface MachiningService {
  id: string;
  seller_profile_id: string;
  title: string;
  process_type: 'CNC Machining' | '3D Printing' | 'Sheet Metal' | 'Laser Cutting';
  description: string;
  base_price: number;
  lead_time: string;
  material_capabilities: string[];
  finish_options: string[];
  created_at: string;
  seller_name?: string;
}

export interface MachiningQuote {
  id: string;
  buyer_profile_id: string;
  service_id: string;
  cad_file_name: string;
  quantity: number;
  selected_material: string;
  selected_finish: string;
  status: 'Pending' | 'Offered' | 'Accepted' | 'Completed';
  offer_price: number | null;
  seller_notes: string | null;
  created_at: string;
  service_title?: string;
  process_type?: string;
  buyer_name?: string;
}

/**
 * Creates a new machining service listing by a seller.
 */
export async function listMachiningService(
  sellerProfileId: string,
  data: {
    title: string;
    processType: 'CNC Machining' | '3D Printing' | 'Sheet Metal' | 'Laser Cutting';
    description: string;
    basePrice: number;
    leadTime: string;
    materials: string[];
    finishes: string[];
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: service, error } = await supabase
    .from('machining_services')
    .insert([
      {
        seller_profile_id: sellerProfileId,
        title: data.title,
        process_type: data.processType,
        description: data.description,
        base_price: data.basePrice,
        lead_time: data.leadTime,
        material_capabilities: data.materials,
        finish_options: data.finishes,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating service listing:', error.message);
    throw new Error(`Failed to list service: ${error.message}`);
  }

  return service as MachiningService;
}

/**
 * Retrieves all listed machining services.
 */
export async function getMachiningServices() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: services, error } = await supabase
    .from('machining_services')
    .select(`
      *,
      profiles:seller_profile_id (
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading services:', error.message);
    return [];
  }

  return (services || []).map((s: any) => ({
    ...s,
    seller_name: s.profiles?.full_name || 'Expert Maker',
  })) as MachiningService[];
}

/**
 * Submits a new CAD quote request by a buyer.
 */
export async function requestMachiningQuote(
  buyerProfileId: string,
  serviceId: string,
  data: {
    cadFileName: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: quote, error } = await supabase
    .from('machining_quotes')
    .insert([
      {
        buyer_profile_id: buyerProfileId,
        service_id: serviceId,
        cad_file_name: data.cadFileName,
        quantity: 1, // Default pending review
        selected_material: 'Pending Review',
        selected_finish: 'Pending Review',
        status: 'Pending',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating quote request:', error.message);
    throw new Error(`Failed to submit quote request: ${error.message}`);
  }

  return quote as MachiningQuote;
}

/**
 * Retrieves all incoming quote requests for services owned by a seller.
 */
export async function getIncomingQuotes(sellerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // First fetch the services owned by this seller
  const { data: services } = await supabase
    .from('machining_services')
    .select('id')
    .eq('seller_profile_id', sellerProfileId);

  const serviceIds = (services || []).map((s) => s.id);
  if (serviceIds.length === 0) return [];

  const { data: quotes, error } = await supabase
    .from('machining_quotes')
    .select(`
      *,
      machining_services:service_id (
        title,
        process_type
      ),
      profiles:buyer_profile_id (
        full_name
      )
    `)
    .in('service_id', serviceIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching incoming quotes:', error.message);
    return [];
  }

  return (quotes || []).map((q: any) => ({
    ...q,
    service_title: q.machining_services?.title || 'Machining Capability',
    process_type: q.machining_services?.process_type || 'CNC',
    buyer_name: q.profiles?.full_name || 'Guest User',
  })) as MachiningQuote[];
}

/**
 * Retrieves all quotes requested by a buyer.
 */
export async function getSubmittedQuotes(buyerProfileId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: quotes, error } = await supabase
    .from('machining_quotes')
    .select(`
      *,
      machining_services:service_id (
        title,
        process_type
      )
    `)
    .eq('buyer_profile_id', buyerProfileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading submitted quotes:', error.message);
    return [];
  }

  return (quotes || []).map((q: any) => ({
    ...q,
    service_title: q.machining_services?.title || 'Machining Capability',
    process_type: q.machining_services?.process_type || 'CNC',
  })) as MachiningQuote[];
}

/**
 * Allows a seller to submit a price offer for a quote request.
 */
export async function submitQuoteOffer(
  quoteId: string,
  data: {
    price: number;
    notes: string;
    quantity: number;
    material: string;
    finish: string;
  }
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: quote, error } = await supabase
    .from('machining_quotes')
    .update({
      offer_price: data.price,
      seller_notes: data.notes,
      quantity: data.quantity,
      selected_material: data.material,
      selected_finish: data.finish,
      status: 'Offered',
    })
    .eq('id', quoteId)
    .select()
    .single();

  if (error) {
    console.error('Error submitting quote offer:', error.message);
    throw new Error(`Failed to submit offer: ${error.message}`);
  }

  return quote as MachiningQuote;
}

/**
 * Allows a buyer to accept an offer and place an order.
 */
export async function acceptQuoteOffer(quoteId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Get the quote details
  const { data: quote, error: quoteErr } = await supabase
    .from('machining_quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (quoteErr || !quote) {
    throw new Error('Quote details not found');
  }

  if (quote.status !== 'Offered' || !quote.offer_price) {
    throw new Error('No valid offer is active on this quote');
  }

  // 2. Mark the quote as Accepted
  const { error: updateErr } = await supabase
    .from('machining_quotes')
    .update({ status: 'Accepted' })
    .eq('id', quoteId);

  if (updateErr) {
    throw new Error(`Failed to accept offer: ${updateErr.message}`);
  }

  // 3. Create a simulated matching order in the orders table
  const orderId = `RFQ-${quote.id.substring(0, 8).toUpperCase()}`;
  const { error: orderErr } = await supabase
    .from('orders')
    .insert([
      {
        id: orderId,
        profile_id: quote.buyer_profile_id,
        total_amount: quote.offer_price,
        items_count: quote.quantity,
        status: 'Processing',
        rewards_claimed: false,
      },
    ]);

  if (orderErr) {
    console.error('Failed to create RFQ order log:', orderErr.message);
  }

  return { success: true, orderId };
}
