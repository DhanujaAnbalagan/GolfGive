import { SupabaseClient } from '@supabase/supabase-js';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  renewal_date: string;
  cancelled_at: string | null;
  created_at: string;
}

export const subscriptionService = {
  /**
   * Utility check if a subscription is active or cancelled with a future renewal date.
   */
  isSubscriptionActive(subscription: Subscription | null): boolean {
    if (!subscription) return false;
    if (subscription.status === 'active') return true;
    if (subscription.status === 'cancelled') {
      return new Date(subscription.renewal_date) >= new Date();
    }
    return false;
  },

  /**
   * Internal status checker to transition active subscriptions past renewal dates into expired.
   * Modifies the DB dynamically on read to ensure state consistency.
   */
  async checkAndUpdateSubscription(supabase: SupabaseClient, subscription: Subscription | null) {
    if (!subscription) return null;

    const now = new Date();
    const renewal = new Date(subscription.renewal_date);

    if (renewal < now && subscription.status === 'active') {
      const { data: updated, error } = await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id)
        .select()
        .single();

      if (!error && updated) {
        return updated;
      }
    }

    return subscription;
  },

  /**
   * Fetch player's current subscription.
   */
  async getSubscription(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, profiles:user_id(full_name, email)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { data: null, error };
    if (!data) return { data: null, error: null };

    // Sync status checking and return updated record
    const updated = await this.checkAndUpdateSubscription(supabase, data);
    return { data: updated as Subscription | null, error: null };
  },

  /**
   * Fetch all subscriptions (Admin only).
   */
  async getAllSubscriptions(
    supabase: SupabaseClient, 
    statusFilter?: string, 
    searchQuery?: string
  ) {
    // We join the profile info to get the user's name and email
    let builder = supabase
      .from('subscriptions')
      .select('*, profiles:user_id(full_name, email)');

    if (statusFilter && statusFilter !== 'all') {
      builder = builder.eq('status', statusFilter);
    }

    const { data, error } = await builder.order('created_at', { ascending: false });

    if (error) return { data: null, error };

    let results = data || [];

    // Filter dynamically by user search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter((sub: Subscription & { profiles?: { full_name?: string; email?: string } }) => {
        const fullName = sub.profiles?.full_name?.toLowerCase() || '';
        const email = sub.profiles?.email?.toLowerCase() || '';
        return fullName.includes(query) || email.includes(query);
      });
    }

    // Map through results to make sure expired states are checked
    const syncPromises = results.map(async (sub: Subscription & { profiles?: { full_name?: string; email?: string } }) => {
      return await this.checkAndUpdateSubscription(supabase, sub);
    });

    const syncedResults = await Promise.all(syncPromises);

    return { data: syncedResults, error: null };
  },

  /**
   * Subscribe/Checkout a user to a plan.
   * If a subscription record already exists, it overrides and reactivates it.
   */
  async subscribe(supabase: SupabaseClient, userId: string, planType: 'monthly' | 'yearly', amount: number) {
    const now = new Date();
    const daysToAdd = planType === 'monthly' ? 30 : 365;
    const renewalDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Check if subscription record already exists
    const { data: existing, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) return { data: null, error: fetchError };

    let result;
    if (existing) {
      result = await supabase
        .from('subscriptions')
        .update({
          plan_type: planType,
          amount,
          status: 'active',
          start_date: now.toISOString(),
          renewal_date: renewalDate.toISOString(),
          cancelled_at: null,
        })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          amount,
          status: 'active',
          start_date: now.toISOString(),
          renewal_date: renewalDate.toISOString(),
        })
        .select()
        .single();
    }

    return { data: result.data as Subscription | null, error: result.error };
  },

  /**
   * Cancel an active subscription. User retains access until renewal date.
   */
  async cancelSubscription(supabase: SupabaseClient, userId: string, subscriptionId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    return { data: data as Subscription | null, error };
  },

  /**
   * Renew an expired or cancelled subscription.
   */
  async renewSubscription(supabase: SupabaseClient, userId: string, subscriptionId: string) {
    // Get existing subscription first to verify plan type
    const { data: sub, error: fetchError } = await supabase
      .from('subscriptions')
      .select('plan_type, amount')
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !sub) {
      return { data: null, error: fetchError || new Error('Subscription not found') };
    }

    const now = new Date();
    const daysToAdd = sub.plan_type === 'monthly' ? 30 : 365;
    const renewalDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        start_date: now.toISOString(),
        renewal_date: renewalDate.toISOString(),
        cancelled_at: null,
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .select()
      .single();

    return { data: data as Subscription | null, error };
  },

  /**
   * Delete subscription (Admin only).
   */
  async deleteSubscription(supabase: SupabaseClient, id: string) {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    return { error };
  }
};
