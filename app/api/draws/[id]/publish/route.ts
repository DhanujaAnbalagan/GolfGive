import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { drawService } from '@/services/drawService';
import { z } from 'zod';

const publishInputSchema = z.object({
  winningNumbers: z.array(z.number().int().min(1).max(45))
    .length(5, 'Must provide exactly 5 numbers')
    .refine((arr) => new Set(arr).size === 5, 'Numbers must be unique')
});

/**
 * POST /api/draws/[id]/publish
 * Publish a draw and freeze/generate final winners (Admin only)
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

    const body = await request.json();
    const validation = publishInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { winningNumbers } = validation.data;
    const { data, error } = await drawService.publishDraw(supabase, id, winningNumbers);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
