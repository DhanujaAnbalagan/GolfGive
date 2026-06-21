import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateWinnerSchema = z.object({
  id: z.string().uuid('Invalid winner ID'),
  payment_status: z.enum(['pending', 'paid'], { message: 'Invalid payment status' })
});

/**
 * GET /api/winners
 * Players retrieve their own winnings. Admins query all winners.
 */
export async function GET() {
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

    if (profile?.role === 'admin') {
      const { data, error } = await supabase
        .from('winners')
        .select(`
          *,
          profiles:user_id(full_name, email),
          draws:draw_id(draw_month, draw_year, jackpot_amount, winning_numbers)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Generate signed URLs for proofs
      const winnersList = data || [];
      for (const w of winnersList) {
        if (w.proof_url) {
          const { data: signedData } = await supabase.storage
            .from('winner-proofs')
            .createSignedUrl(w.proof_url, 3600);
          w.signed_proof_url = signedData?.signedUrl || null;
        }
      }

      return NextResponse.json(winnersList);
    } else {
      const { data, error } = await supabase
        .from('winners')
        .select(`
          *,
          draws:draw_id(draw_month, draw_year, jackpot_amount, winning_numbers)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const winnersList = data || [];
      for (const w of winnersList) {
        if (w.proof_url) {
          const { data: signedData } = await supabase.storage
            .from('winner-proofs')
            .createSignedUrl(w.proof_url, 3600);
          w.signed_proof_url = signedData?.signedUrl || null;
        }
      }

      return NextResponse.json(winnersList);
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/winners
 * Update winner's payment status (Admin only)
 */
export async function PUT(request: Request) {
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
    const validation = updateWinnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, payment_status } = validation.data;
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
