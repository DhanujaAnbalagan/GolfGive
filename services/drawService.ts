import { SupabaseClient } from '@supabase/supabase-js';
import { winnerService } from './winnerService';
import { prizeService } from './prizeService';

export interface DrawData {
  id: string;
  draw_month: number;
  draw_year: number;
  draw_type: '5 Match' | '4 Match' | '3 Match';
  status: 'draft' | 'simulation' | 'published' | 'completed';
  winning_numbers: number[] | null;
  jackpot_amount: number;
  simulation_results: Record<string, unknown> | null;
  created_at: string;
}

export const drawService = {
  /**
   * Fetch all draws.
   * If user is admin, returns all. Otherwise, returns only published or completed.
   */
  async getDraws(supabase: SupabaseClient, isAdmin: boolean) {
    let query = supabase.from('draws').select('*');
    if (!isAdmin) {
      query = query.in('status', ['published', 'completed']);
    }
    const { data, error } = await query.order('draw_year', { ascending: false }).order('draw_month', { ascending: false });
    return { data: data as DrawData[] | null, error };
  },

  /**
   * Fetch draw by ID.
   */
  async getDrawById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('draws')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { data: data as DrawData | null, error };
  },

  /**
   * Create a new draft draw.
   */
  async createDraw(
    supabase: SupabaseClient,
    drawMonth: number,
    drawYear: number,
    drawType: '5 Match' | '4 Match' | '3 Match',
    jackpotAmount: number
  ) {
    const { data, error } = await supabase
      .from('draws')
      .insert({
        draw_month: drawMonth,
        draw_year: drawYear,
        draw_type: drawType,
        jackpot_amount: jackpotAmount,
        status: 'draft'
      })
      .select()
      .single();

    return { data: data as DrawData | null, error };
  },

  /**
   * Update draw details.
   */
  async updateDraw(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<DrawData, 'id' | 'created_at'>>
  ) {
    const { data, error } = await supabase
      .from('draws')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data: data as DrawData | null, error };
  },

  /**
   * Delete draw.
   */
  async deleteDraw(supabase: SupabaseClient, id: string) {
    const { error } = await supabase.from('draws').delete().eq('id', id);
    return { error };
  },

  /**
   * Generate winning numbers based on mode:
   * - 'random': Uniformly random 5 numbers from 1 to 45
   * - 'weighted': Frequency weighted based on logged golf scores
   */
  async generateWinningNumbers(supabase: SupabaseClient, mode: 'random' | 'weighted'): Promise<number[]> {
    if (mode === 'weighted') {
      const { data: scores, error } = await supabase
        .from('golf_scores')
        .select('score');

      if (error || !scores || scores.length < 5) {
        return this.generateRandomNumbers();
      }

      // Golf score values are between 1 and 45.
      // Build frequency array (1-indexed, size 46)
      const frequencies = new Array(46).fill(0);
      for (const row of scores) {
        const val = row.score;
        if (val >= 1 && val <= 45) {
          frequencies[val]++;
        }
      }

      // Assign weight = frequency + 1 (ensure all numbers have a baseline probability)
      const weights = new Array(46).fill(1);
      for (let i = 1; i <= 45; i++) {
        weights[i] = frequencies[i] + 1;
      }

      const selected: number[] = [];
      const selectedSet = new Set<number>();

      for (let step = 0; step < 5; step++) {
        let totalWeight = 0;
        for (let i = 1; i <= 45; i++) {
          if (!selectedSet.has(i)) {
            totalWeight += weights[i];
          }
        }

        let r = Math.random() * totalWeight;
        for (let i = 1; i <= 45; i++) {
          if (!selectedSet.has(i)) {
            r -= weights[i];
            if (r <= 0) {
              selected.push(i);
              selectedSet.add(i);
              break;
            }
          }
        }
      }

      return selected.sort((a, b) => a - b);
    } else {
      return this.generateRandomNumbers();
    }
  },

  /**
   * Generate uniform random winning numbers.
   */
  generateRandomNumbers(): number[] {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  },

  /**
   * Run simulation: calculates potential winners and updates simulation_results without writing to winners table.
   */
  async simulateDraw(
    supabase: SupabaseClient,
    drawId: string,
    options: { mode?: 'random' | 'weighted'; winningNumbers?: number[] }
  ) {
    // 1. Fetch draw details
    const { data: draw, error: drawError } = await this.getDrawById(supabase, drawId);
    if (drawError || !draw) {
      return { data: null, error: drawError || new Error('Draw not found') };
    }

    // 2. Resolve winning numbers
    let winningNumbers = options.winningNumbers;
    if (!winningNumbers) {
      winningNumbers = await this.generateWinningNumbers(supabase, options.mode || 'random');
    }

    // 3. Calculate rollover
    const rollover = await prizeService.getJackpotRollover(supabase);

    // 4. Calculate winners and summary
    const { summary } = await winnerService.calculateWinners(
      supabase,
      drawId,
      winningNumbers,
      draw.jackpot_amount,
      rollover
    );

    // 5. Update draw with simulation results and set status to simulation
    const { data: updatedDraw, error: updateError } = await supabase
      .from('draws')
      .update({
        status: 'simulation',
        simulation_results: summary
      })
      .eq('id', drawId)
      .select()
      .single();

    return { data: updatedDraw as DrawData | null, error: updateError };
  },

  /**
   * Publish final draw results: commits final winners to winners table, processes rollover, set status to completed.
   */
  async publishDraw(
    supabase: SupabaseClient,
    drawId: string,
    winningNumbers: number[]
  ) {
    // 1. Fetch draw details
    const { data: draw, error: drawError } = await this.getDrawById(supabase, drawId);
    if (drawError || !draw) {
      return { data: null, error: drawError || new Error('Draw not found') };
    }

    if (draw.status === 'completed') {
      return { data: null, error: new Error('Draw is already completed') };
    }

    // 2. Calculate rollover
    const rollover = await prizeService.getJackpotRollover(supabase);

    // 3. Calculate final winners
    const { winners, summary } = await winnerService.calculateWinners(
      supabase,
      drawId,
      winningNumbers,
      draw.jackpot_amount,
      rollover
    );

    // 4. Insert winners in winners table
    if (winners.length > 0) {
      const { error: insertError } = await supabase.from('winners').insert(winners);
      if (insertError) {
        return { data: null, error: insertError };
      }
    }

    // 5. Update draw status to completed and save details
    const { data: updatedDraw, error: updateError } = await supabase
      .from('draws')
      .update({
        status: 'completed',
        winning_numbers: winningNumbers,
        simulation_results: summary
      })
      .eq('id', drawId)
      .select()
      .single();

    return { data: updatedDraw as DrawData | null, error: updateError };
  }
};
