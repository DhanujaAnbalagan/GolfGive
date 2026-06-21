import { SupabaseClient } from '@supabase/supabase-js';
import { verificationService } from './verificationService';

export const paymentService = {
  /**
   * Helper to verify if winner is approved
   */
  async checkApproved(supabase: SupabaseClient, winnerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('winners')
      .select('verification_status')
      .eq('id', winnerId)
      .single();

    if (error || !data) return false;
    return data.verification_status === 'approved';
  },

  /**
   * Admin sets payment status to processing (Only for approved winners)
   */
  async markProcessing(supabase: SupabaseClient, winnerId: string) {
    const isApproved = await this.checkApproved(supabase, winnerId);
    if (!isApproved) {
      return { data: null, error: new Error('Payment can only be processed for approved winners.') };
    }

    const { data: winner } = await supabase
      .from('winners')
      .select('user_id')
      .eq('id', winnerId)
      .single();

    const { data, error } = await supabase
      .from('winners')
      .update({
        payment_status: 'processing'
      })
      .eq('id', winnerId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (winner) {
      await verificationService.createNotification(
        supabase,
        winner.user_id,
        'Payment Processing',
        'Your prize reward is currently being processed. Expected disbursement soon!',
        'info'
      );
    }

    return { data, error: null };
  },

  /**
   * Admin sets payment status to paid (Only for approved winners)
   */
  async markPaid(supabase: SupabaseClient, winnerId: string) {
    const isApproved = await this.checkApproved(supabase, winnerId);
    if (!isApproved) {
      return { data: null, error: new Error('Payment can only be processed for approved winners.') };
    }

    const { data: winner } = await supabase
      .from('winners')
      .select('user_id')
      .eq('id', winnerId)
      .single();

    const { data, error } = await supabase
      .from('winners')
      .update({
        payment_status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', winnerId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (winner) {
      await verificationService.createNotification(
        supabase,
        winner.user_id,
        'Payment Processed',
        'Success! Your prize reward has been disbursed. Thank you for participating!',
        'success'
      );
    }

    return { data, error: null };
  }
};
