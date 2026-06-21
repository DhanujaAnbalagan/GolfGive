import { SupabaseClient } from '@supabase/supabase-js';
import { prizeService } from './prizeService';

export interface WinnerRecord {
  user_id: string;
  draw_id: string;
  match_type: number;
  prize_amount: number;
  payment_status: 'pending' | 'paid';
}

export interface SimulationSummary {
  winning_numbers: number[];
  jackpot_amount: number;
  rollover_amount: number;
  pools: {
    match5: number;
    match4: number;
    match3: number;
  };
  winners_count: {
    match5: number;
    match4: number;
    match3: number;
  };
  prizes: {
    match5: number;
    match4: number;
    match3: number;
  };
  winners_list: {
    user_id: string;
    full_name?: string;
    email?: string;
    match_type: number;
    prize_amount: number;
  }[];
}

export const winnerService = {
  /**
   * Calculate intersection between winning numbers and entry numbers.
   */
  calculateMatches(winningNumbers: number[], entryNumbers: number[]): number {
    if (!winningNumbers || !entryNumbers) return 0;
    const winningSet = new Set(winningNumbers);
    let matches = 0;
    for (const num of entryNumbers) {
      if (winningSet.has(num)) {
        matches++;
      }
    }
    return matches;
  },

  /**
   * Process all entries for a draw, calculate matches, allocate pools, split, and construct winners list.
   */
  async calculateWinners(
    supabase: SupabaseClient,
    drawId: string,
    winningNumbers: number[],
    jackpotAmount: number,
    rolloverAmount: number
  ): Promise<{ winners: WinnerRecord[]; summary: SimulationSummary }> {
    // 1. Fetch all entries for this draw, along with user profiles details
    const { data: entries, error } = await supabase
      .from('draw_entries')
      .select('*, profiles:user_id(full_name, email)')
      .eq('draw_id', drawId);

    if (error) {
      throw new Error(`Failed to fetch draw entries: ${error.message}`);
    }

    const entriesList = entries || [];

    // 2. Classify entries by match type
    const matchGroups: { [key: number]: typeof entriesList } = {
      3: [],
      4: [],
      5: []
    };

    for (const entry of entriesList) {
      const matchCount = this.calculateMatches(winningNumbers, entry.entry_numbers || []);
      if (matchCount >= 3 && matchCount <= 5) {
        matchGroups[matchCount].push(entry);
      }
    }

    // 3. Calculate category pools
    const basePools = prizeService.calculatePrizePool(jackpotAmount);
    
    // 5 Match pool includes rollover
    const pools = {
      match5: Number((basePools.match5 + rolloverAmount).toFixed(2)),
      match4: basePools.match4,
      match3: basePools.match3
    };

    const winnersCount = {
      match5: matchGroups[5].length,
      match4: matchGroups[4].length,
      match3: matchGroups[3].length
    };

    // 4. Calculate individual prizes per match type
    const prizes = {
      match5: prizeService.splitPrize(pools.match5, winnersCount.match5),
      match4: prizeService.splitPrize(pools.match4, winnersCount.match4),
      match3: prizeService.splitPrize(pools.match3, winnersCount.match3)
    };

    // 5. Construct winners records and detailed list for summary
    const winners: WinnerRecord[] = [];
    const winners_list: SimulationSummary['winners_list'] = [];

    // Helper to process a group
    const processGroup = (matchType: number, group: typeof entriesList, prizeAmount: number) => {
      for (const entry of group) {
        winners.push({
          user_id: entry.user_id,
          draw_id: drawId,
          match_type: matchType,
          prize_amount: prizeAmount,
          payment_status: 'pending'
        });

        winners_list.push({
          user_id: entry.user_id,
          full_name: entry.profiles?.full_name || 'Anonymous User',
          email: entry.profiles?.email || '',
          match_type: matchType,
          prize_amount: prizeAmount
        });
      }
    };

    processGroup(5, matchGroups[5], prizes.match5);
    processGroup(4, matchGroups[4], prizes.match4);
    processGroup(3, matchGroups[3], prizes.match3);

    const summary: SimulationSummary = {
      winning_numbers: winningNumbers,
      jackpot_amount: jackpotAmount,
      rollover_amount: rolloverAmount,
      pools,
      winners_count: winnersCount,
      prizes,
      winners_list
    };

    return { winners, summary };
  }
};
