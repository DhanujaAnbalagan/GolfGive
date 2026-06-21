import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateWinnerStatusSchema = z.object({
  payment_status: z.enum(['pending', 'processing', 'paid'], { message: 'Invalid payment status' })
});

/**
 * GET /api/winners/[id]
 * Retrieve details of a single winner. Generates a signed URL for private proof files.
 */
export async function GET(
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

    const isAdmin = profile?.role === 'admin';

    // Fetch winner record
    const { data: winner, error } = await supabase
      .from('winners')
      .select(`
        *,
        profiles:user_id(full_name, email),
        draws:draw_id(draw_month, draw_year, jackpot_amount, winning_numbers)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!winner) {
      return NextResponse.json({ error: 'Winner record not found' }, { status: 404 });
    }

    // Access control
    if (!isAdmin && winner.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate signed URL if proof exists
    if (winner.proof_url) {
      const { data: signedData, error: signedError } = await supabase.storage
        .from('winner-proofs')
        .createSignedUrl(winner.proof_url, 3600); // 1 hour expiration
      
      if (!signedError && signedData) {
        winner.signed_proof_url = signedData.signedUrl;
      }
    }

    return NextResponse.json(winner);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/winners/[id]
 * Update winner's payment status directly (Admin only)
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
    const validation = updateWinnerStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { payment_status } = validation.data;
    const { data, error } = await supabase
      .from('winners')
      .update({ payment_status })
      .eq('id', id)
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
