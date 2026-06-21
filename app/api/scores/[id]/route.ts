import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scoreService } from '@/services/scoreService';
import { subscriptionService } from '@/services/subscriptionService';
import { z } from 'zod';

const scoreInputSchema = z.object({
  score: z.number({ message: 'Score is required' })
    .int('Score must be an integer')
    .min(1, 'Score must be at least 1')
    .max(45, 'Score cannot exceed 45'),
  score_date: z.string({ message: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
});

/**
 * PUT /api/scores/[id]
 * Update a score
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription status
    const { data: sub, error: subError } = await subscriptionService.getSubscription(supabase, user.id);
    if (subError) {
      return NextResponse.json({ error: 'Failed to verify subscription status' }, { status: 500 });
    }
    if (!subscriptionService.isSubscriptionActive(sub)) {
      return NextResponse.json({ error: 'Active subscription required to edit scores' }, { status: 403 });
    }

    const { id: scoreId } = await params;
    const body = await request.json();
    const validation = scoreInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors }, 
        { status: 400 }
      );
    }

    const { score, score_date } = validation.data;
    const { data, error } = await scoreService.updateScore(
      supabase,
      user.id,
      scoreId,
      score,
      score_date
    );

    if (error) {
      const status = (error as { status?: number }).status || 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/scores/[id]
 * Delete a score
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: scoreId } = await params;
    const { error } = await scoreService.deleteScore(supabase, user.id, scoreId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
