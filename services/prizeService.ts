import { SupabaseClient } from '@supabase/supabase-js';

export const prizeService = {
  /**
   * Split a prize pool amount into categories:
   * - 5 Match: 40%
   * - 4 Match: 35%
   * - 3 Match: 25%
   */
  calculatePrizePool(amount: number) {
    return {
      match5: Number((amount * 0.40).toFixed(2)),
      match4: Number((amount * 0.35).toFixed(2)),
      match3: Number((amount * 0.25).toFixed(2))
    };
  },

  /**
   * Split the category pool equally among winners
   */
  splitPrize(categoryPool: number, winnerCount: number): number {
    if (winnerCount <= 0) return 0;
    return Number((categoryPool / winnerCount).toFixed(2));
  },

  /**
   * Calculate cumulative rollover amount by iterating chronologically through completed draws.
   * If a draw has status 'completed' and contains no 5-match winners, the 5-match portion
   * (40% of its pool + any rolled over amount) is carried forward to the next draw.
   */
  async getJackpotRollover(supabase: SupabaseClient): Promise<number> {
    try {
      // Get all completed draws sorted chronologically
      const { data: draws, error: drawsError } = await supabase
        .from('draws')
        .select('id, jackpot_amount, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (drawsError || !draws) return 0;

      let currentRollover = 0;

      for (const draw of draws) {
        // Check if there were any 5-match winners for this draw
        const { count, error: countError } = await supabase
          .from('winners')
          .select('*', { count: 'exact', head: true })
          .eq('draw_id', draw.id)
          .eq('match_type', 5);

        const draw5MatchPool = (draw.jackpot_amount * 0.40) + currentRollover;

        if (countError) continue;

        if (count && count > 0) {
          // Jackpot was claimed, rollover resets
          currentRollover = 0;
        } else {
          // Jackpot not claimed, rolls over
          currentRollover = draw5MatchPool;
        }
      }

      return Number(currentRollover.toFixed(2));
    } catch (err) {
      console.error('Error calculating jackpot rollover:', err);
      return 0;
    }
  }
};
