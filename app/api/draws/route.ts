import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { drawService } from '@/services/drawService';
import { z } from 'zod';

const drawInputSchema = z.object({
  draw_month: z.number({ message: 'Month is required' })
    .int('Month must be an integer')
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  draw_year: z.number({ message: 'Year is required' })
    .int('Year must be an integer')
    .min(2026, 'Year must be 2026 or later'),
  draw_type: z.enum(['5 Match', '4 Match', '3 Match'], { message: 'Invalid draw type' }),
  jackpot_amount: z.number({ message: 'Jackpot amount is required' })
    .min(0, 'Jackpot amount cannot be negative')
});

/**
 * GET /api/draws
 * Retrieve all draws (admins get all, regular users get published/completed draws only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const { data, error } = await drawService.getDraws(supabase, isAdmin);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/draws
 * Create a new draft draw (Admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = drawInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { draw_month, draw_year, draw_type, jackpot_amount } = validation.data;
    const { data, error } = await drawService.createDraw(
      supabase,
      draw_month,
      draw_year,
      draw_type,
      jackpot_amount
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
