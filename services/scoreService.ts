import { SupabaseClient } from '@supabase/supabase-js';

export interface ScoreData {
  id: string;
  user_id: string;
  score: number;
  score_date: string;
  created_at: string;
}

export const scoreService = {
  /**
   * Fetch all scores for a user, sorted by date in descending order (newest first).
   */
  async getScores(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from('golf_scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false });

    return { data: data as ScoreData[] | null, error };
  },

  /**
   * Add a new score. If the user already has 5 scores, the oldest one is deleted first.
   * Prevents submission if a score for that date already exists.
   */
  async addScore(supabase: SupabaseClient, userId: string, score: number, scoreDate: string) {
    // 1. Check if a score for this date already exists
    const { data: existingScore, error: checkError } = await supabase
      .from('golf_scores')
      .select('id')
      .eq('user_id', userId)
      .eq('score_date', scoreDate)
      .maybeSingle();

    if (checkError) return { data: null, error: checkError };
    if (existingScore) {
      return { 
        data: null, 
        error: { 
          message: 'A score for this date already exists.',
          status: 409
        } 
      };
    }

    // 2. Count existing scores
    const { count, error: countError } = await supabase
      .from('golf_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) return { data: null, error: countError };

    // 3. If 5 or more scores exist, delete the oldest score (by score_date ascending)
    if (count !== null && count >= 5) {
      const { data: oldestScores, error: findError } = await supabase
        .from('golf_scores')
        .select('id, score_date')
        .eq('user_id', userId)
        .order('score_date', { ascending: true })
        .limit(1);

      if (findError) return { data: null, error: findError };

      if (oldestScores && oldestScores.length > 0) {
        const { error: deleteError } = await supabase
          .from('golf_scores')
          .delete()
          .eq('id', oldestScores[0].id);

        if (deleteError) return { data: null, error: deleteError };
      }
    }

    // 4. Insert new score
    const { data, error: insertError } = await supabase
      .from('golf_scores')
      .insert({
        user_id: userId,
        score,
        score_date: scoreDate,
      })
      .select()
      .single();

    return { data: data as ScoreData | null, error: insertError };
  },

  /**
   * Update an existing score.
   * Ensures that updating to another date doesn't create duplicates.
   */
  async updateScore(
    supabase: SupabaseClient, 
    userId: string, 
    scoreId: string, 
    score: number, 
    scoreDate: string
  ) {
    // 1. Check if another score with this date already exists (excluding current score id)
    const { data: existingScore, error: checkError } = await supabase
      .from('golf_scores')
      .select('id')
      .eq('user_id', userId)
      .eq('score_date', scoreDate)
      .neq('id', scoreId)
      .maybeSingle();

    if (checkError) return { data: null, error: checkError };
    if (existingScore) {
      return { 
        data: null, 
        error: { 
          message: 'A score for this date already exists.',
          status: 409
        } 
      };
    }

    // 2. Perform the update
    const { data, error: updateError } = await supabase
      .from('golf_scores')
      .update({
        score,
        score_date: scoreDate,
      })
      .eq('id', scoreId)
      .eq('user_id', userId)
      .select()
      .single();

    return { data: data as ScoreData | null, error: updateError };
  },

  /**
   * Delete a score by ID.
   */
  async deleteScore(supabase: SupabaseClient, userId: string, scoreId: string) {
    const { error } = await supabase
      .from('golf_scores')
      .delete()
      .eq('id', scoreId)
      .eq('user_id', userId);

    return { error };
  }
};
