//ASubscription context provider

// src/lib/context/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabase/client';
import { Subscription, UsageStats } from '../supabase/database.types';
import { getSubscription, getUsageStats } from '../api/subscriptions';

interface SubscriptionContextType {
  subscription: Subscription | null;
  tier: 'free' | 'premium';
  isActive: boolean;
  usageStats: UsageStats | null;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
  refreshUsageStats: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed properties
  const tier: 'free' | 'premium' = subscription?.tier === 'premium' ? 'premium' : 'free';
  const isActive = subscription?.status === 'active';

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Fetch subscription info
      const subscriptionData = await getSubscription(user.id);
      setSubscription(subscriptionData);
      
      // Fetch usage stats
      const usageData = await getUsageStats(user.id);
      setUsageStats(usageData);
    } catch (error) {
      console.error('Error in subscription data fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize subscription data when auth state changes
  useEffect(() => {
    if (!isLoadingAuth) {
      fetchSubscriptionData();
    }
  }, [user, isLoadingAuth]);

  // Set up realtime subscription to subscription changes
  // src/lib/context/SubscriptionContext.tsx - Update useEffect for realtime subscriptions

// Set up realtime subscription to subscription and usage stats changes
useEffect(() => {
    if (!user) return;
    
    const subscriptionChannel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSubscription(null);
          } else {
            setSubscription(payload.new as Subscription);
          }
        }
      )
      .subscribe();
      
    // Listen for usage_stats updates that are triggered by database functions
    const usageStatsChannel = supabase
      .channel('usage-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_stats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType !== 'DELETE') {
            setUsageStats(payload.new as UsageStats);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscriptionChannel);
      supabase.removeChannel(usageStatsChannel);
    };
  }, [user]);

  const refreshSubscription = async () => {
    if (!user) return;
    
    try {
      const subscriptionData = await getSubscription(user.id);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  const refreshUsageStats = async () => {
    if (!user) return;
    
    try {
      const usageData = await getUsageStats(user.id);
      setUsageStats(usageData);
    } catch (error) {
        console.error('Error refreshing usage stats:', error);
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    tier,
    isActive,
    usageStats,
    isLoading,
    refreshSubscription,
    refreshUsageStats,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

// Custom hook for using the subscription context
export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
      throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
  };