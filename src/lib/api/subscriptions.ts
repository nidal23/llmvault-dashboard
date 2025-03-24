//Subscription operations

// src/lib/api/subscriptions.ts
import { supabase } from '../supabase/client';
import type { Subscription, UsageStats } from '../supabase/database.types';

export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  return data;
};

export const getUsageStats = async (userId: string): Promise<UsageStats | null> => {
  const { data, error } = await supabase
    .from('usage_stats')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  return data;
};

export const upgradeSubscription = async (userId: string, tier: 'premium', paymentDetails: unknown): Promise<Subscription> => {
    console.log('paymentDetails', paymentDetails)
  // In a real app, this would interact with Stripe or another payment processor
  // For now, we'll just update the subscription directly
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      tier,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const cancelSubscription = async (userId: string): Promise<Subscription> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};