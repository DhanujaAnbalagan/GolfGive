import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/services/subscriptionService';
import { z } from 'zod';

const subscriptionInputSchema = z.object({
  plan_type: z.enum(['monthly', 'yearly'], { message: 'Invalid plan type' }),
  amount: z.number({ message: 'Amount must be a number' }).min(0, 'Amount cannot be negative')
});

/**
 * GET /api/subscriptions
 * Players retrieve their own subscription.
 * Admins retrieve all subscriptions (supports status filter and user search query).
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      // Admin request: get all subscriptions
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || undefined;
      const search = searchParams.get('q') || undefined;

      const { data, error } = await subscriptionService.getAllSubscriptions(supabase, status, search);
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    } else {
      // Normal user request: get own subscription
      const { data, error } = await subscriptionService.getSubscription(supabase, user.id);
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/subscriptions
 * Subscribe to a plan (simulates mock checkout callback)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = subscriptionInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { plan_type, amount } = validation.data;
    const { data, error } = await subscriptionService.subscribe(supabase, user.id, plan_type, amount);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
