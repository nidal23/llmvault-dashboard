// src/lib/stores/useSubscriptionStore.ts
import { create } from 'zustand';
import { Subscription, UsageStats } from '../supabase/database.types';
import { getSubscription, getUsageStats, upgradeSubscription, cancelSubscription } from '../api/subscriptions';
import { supabase } from '../supabase/client';
import { toast } from 'react-hot-toast';

interface SubscriptionState {
  // Data
  subscription: Subscription | null;
  usageStats: UsageStats | null;
  
  // Computed properties
  tier: 'free' | 'premium';
  isActive: boolean;
  
  // UI state
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchSubscription: (userId: string) => Promise<void>;
  fetchUsageStats: (userId: string) => Promise<void>;
  setupRealtimeListeners: (userId: string) => () => void;
  upgradeSubscription: (userId: string, paymentDetails: unknown) => Promise<Subscription | null>;
  cancelSubscription: (userId: string) => Promise<Subscription | null>;
}

export const useSubscriptionStore = create<SubscriptionState>()((set, get) => ({
  // Initial state
  subscription: null,
  usageStats: null,
  tier: 'free',
  isActive: false,
  isLoading: false,
  error: null,
  
  // Fetch subscription data
  fetchSubscription: async (userId: string) => {
    if (!userId) return;
    
    set({ isLoading: true });
    
    try {
      const data = await getSubscription(userId);
      
      set({ 
        subscription: data,
        tier: data?.tier === 'premium' ? 'premium' : 'free',
        isActive: data?.status === 'active',
        isLoading: false
      });
    } catch (err) {
      console.error('Error fetching subscription:', err);
      set({ 
        error: err instanceof Error ? err : new Error('Failed to fetch subscription'),
        isLoading: false
      });
    }
  },
  
  // Fetch usage stats
  fetchUsageStats: async (userId: string) => {
    if (!userId) return;
    
    try {
      const data = await getUsageStats(userId);
      set({ usageStats: data });
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      // Don't set error state here as it's not critical
    }
  },
  
  // Set up realtime listeners
  setupRealtimeListeners: (userId: string) => {
    if (!userId) return () => {};
    
    // Subscription changes listener
    const subscriptionChannel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            set({ 
              subscription: null,
              tier: 'free',
              isActive: false
            });
          } else {
            const newSubscription = payload.new as Subscription;
            set({
              subscription: newSubscription,
              tier: newSubscription?.tier === 'premium' ? 'premium' : 'free',
              isActive: newSubscription?.status === 'active'
            });
          }
        }
      )
      .subscribe();
      
    // Usage stats changes listener
    const usageStatsChannel = supabase
      .channel('usage-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_stats',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType !== 'DELETE') {
            set({ usageStats: payload.new as UsageStats });
          }
        }
      )
      .subscribe();
    
    // Return cleanup function
    return () => {
      supabase.removeChannel(subscriptionChannel);
      supabase.removeChannel(usageStatsChannel);
    };
  },
  
  // Upgrade subscription
  upgradeSubscription: async (userId: string, paymentDetails: unknown) => {
    if (!userId) return null;
    
    set({ isLoading: true });
    
    try {
      const upgradedSubscription = await upgradeSubscription(userId, 'premium', paymentDetails);
      
      set({
        subscription: upgradedSubscription,
        tier: 'premium',
        isActive: upgradedSubscription.status === 'active',
        isLoading: false
      });
      
      toast.success('Subscription upgraded successfully');
      return upgradedSubscription;
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      set({ 
        error: err instanceof Error ? err : new Error('Failed to upgrade subscription'),
        isLoading: false
      });
      
      toast.error('Failed to upgrade subscription');
      return null;
    }
  },
  
  // Cancel subscription
  cancelSubscription: async (userId: string) => {
    if (!userId) return null;
    
    set({ isLoading: true });
    
    try {
      const canceledSubscription = await cancelSubscription(userId);
      
      set({
        subscription: canceledSubscription,
        isActive: false,
        isLoading: false
      });
      
      toast.success('Subscription canceled successfully');
      return canceledSubscription;
    } catch (err) {
      console.error('Error canceling subscription:', err);
      set({ 
        error: err instanceof Error ? err : new Error('Failed to cancel subscription'),
        isLoading: false
      });
      
      toast.error('Failed to cancel subscription');
      return null;
    }
  },

  getTier: () => {
    const { subscription } = get();
    return subscription?.tier === 'premium' ? 'premium' : 'free';
  },
  
  getIsActive: () => {
    const { subscription } = get();
    return subscription?.status === 'active';
  }
}));