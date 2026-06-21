import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { drawService } from '@/services/drawService';
import { subscriptionService } from '@/services/subscriptionService';
import { z } from 'zod';

const entryInputSchema = z.object({
  // Use z.number() strictly and register numeric inputs properly
  entry_numbers: z.array(z.number().int().min(1).max(45))
    .length(5, 'Must choose exactly 5 numbers')
    .refine((arr) => new Set(arr).size === 5, 'Numbers must be unique')
});

/**
 * POST /api/draws/[id]/entries
 * Submit or update user's entry for a draw (Active subscription required, draw must be open)
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

    // 1. Verify subscription is active
    const { data: sub, error: subError } = await subscriptionService.getSubscription(supabase, user.id);
    if (subError) {
      return NextResponse.json({ error: 'Failed to verify subscription status' }, { status: 500 });
    }
    if (!subscriptionService.isSubscriptionActive(sub)) {
      return NextResponse.json({ error: 'Active subscription required to enter draws' }, { status: 403 });
    }

    // 2. Check draw status
    const { data: draw, error: drawError } = await drawService.getDrawById(supabase, id);
    if (drawError || !draw) {
      return NextResponse.json({ error: drawError?.message || 'Draw not found' }, { status: 404 });
    }
    if (draw.status === 'completed') {
      return NextResponse.json({ error: 'Cannot submit entries to a completed draw' }, { status: 400 });
    }

    // 3. Validate entry numbers
    const body = await request.json();
    const validation = entryInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { entry_numbers } = validation.data;

    // 4. Upsert entry to support update/change of numbers
    const { data, error } = await supabase
      .from('draw_entries')
      .upsert({
        draw_id: id,
        user_id: user.id,
        entry_numbers
      }, { onConflict: 'draw_id,user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/draws/[id]/entries
 * Withdraw user's entry for a draw (only allowed before publishing/completed status)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check draw status
    const { data: draw, error: drawError } = await drawService.getDrawById(supabase, id);
    if (drawError || !draw) {
      return NextResponse.json({ error: drawError?.message || 'Draw not found' }, { status: 404 });
    }
    if (draw.status === 'completed') {
      return NextResponse.json({ error: 'Cannot withdraw from a completed draw' }, { status: 400 });
    }

    const { error } = await supabase
      .from('draw_entries')
      .delete()
      .eq('draw_id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
