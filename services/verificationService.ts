import { SupabaseClient } from '@supabase/supabase-js';

export const verificationService = {
  /**
   * Helper to create in-app notification logs for players
   */
  async createNotification(
    supabase: SupabaseClient,
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false
      });
    if (error) {
      console.error('Error creating notification:', error.message);
    }
  },

  /**
   * Upload proof scorecard to winner-proofs bucket and update winners table
   */
  async submitProof(
    supabase: SupabaseClient,
    winnerId: string,
    userId: string,
    fileBuffer: Buffer | ArrayBuffer,
    fileName: string,
    contentType: string
  ) {
    const fileExtension = fileName.split('.').pop();
    const storagePath = `${userId}/${winnerId}_${Date.now()}.${fileExtension}`;

    // 1. Upload to Supabase Storage private bucket
    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // 2. Update winners record (store storage path, status = pending)
    const { data, error } = await supabase
      .from('winners')
      .update({
        proof_url: storagePath,
        verification_status: 'pending'
      })
      .eq('id', winnerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // 3. Trigger notification
    await this.createNotification(
      supabase,
      userId,
      'Proof Submitted',
      'Your proof of winning score has been submitted for admin review.',
      'info'
    );

    return { data, error: null };
  },

  /**
   * Admin approves a winner's proof
   */
  async approveWinner(supabase: SupabaseClient, winnerId: string, adminId: string) {
    // Get winner details to fetch user_id for notifications
    const { data: winner } = await supabase
      .from('winners')
      .select('user_id')
      .eq('id', winnerId)
      .single();

    const { data, error } = await supabase
      .from('winners')
      .update({
        verification_status: 'approved',
        verified_by: adminId,
        verified_at: new Date().toISOString()
      })
      .eq('id', winnerId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (winner) {
      await this.createNotification(
        supabase,
        winner.user_id,
        'Proof Approved',
        'Congratulations! Your scorecard proof has been approved. Your payout is pending processing.',
        'success'
      );
    }

    return { data, error: null };
  },

  /**
   * Admin rejects a winner's proof
   */
  async rejectWinner(supabase: SupabaseClient, winnerId: string, adminId: string, notes: string) {
    const { data: winner } = await supabase
      .from('winners')
      .select('user_id')
      .eq('id', winnerId)
      .single();

    const { data, error } = await supabase
      .from('winners')
      .update({
        verification_status: 'rejected',
        review_notes: notes,
        verified_by: adminId,
        verified_at: new Date().toISOString()
      })
      .eq('id', winnerId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (winner) {
      await this.createNotification(
        supabase,
        winner.user_id,
        'Proof Rejected',
        `Your scorecard proof was rejected. Review notes: ${notes}. Please re-upload.`,
        'error'
      );
    }

    return { data, error: null };
  }
};
