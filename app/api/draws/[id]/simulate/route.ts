import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { drawService } from '@/services/drawService';
import { z } from 'zod';

const simulateInputSchema = z.object({
  mode: z.enum(['random', 'weighted']).optional(),
  winningNumbers: z.array(z.number().int().min(1).max(45)).length(5).optional()
});

/**
 * POST /api/draws/[id]/simulate
 * Run a simulation for a draw (Admin only)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json().catch(() => ({}));
    const validation = simulateInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { mode, winningNumbers } = validation.data;
    const { data, error } = await drawService.simulateDraw(supabase, id, {
      mode,
      winningNumbers
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
