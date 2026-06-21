import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verificationService } from '@/services/verificationService';
import { z } from 'zod';

const rejectSchema = z.object({
  notes: z.string({ message: 'Review notes are required' }).min(1, 'Review notes cannot be empty')
});

/**
 * PUT /api/winners/[id]/reject
 * Admin rejects a winner's proof scorecard (Admin only)
 */
export async function PUT(
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
    const validation = rejectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { notes } = validation.data;

    // Call service to reject
    const { data, error } = await verificationService.rejectWinner(supabase, id, user.id, notes);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
