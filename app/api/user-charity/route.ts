import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { charityService } from '@/services/charityService';
import { z } from 'zod';

const userCharitySchema = z.object({
  charity_id: z.string({ message: 'Charity ID is required' }).uuid('Invalid Charity ID'),
  contribution_percentage: z.number({ message: 'Contribution percentage must be a number' })
    .int('Percentage must be an integer')
    .min(10, 'Minimum contribution is 10%')
    .max(100, 'Maximum contribution is 100%')
    .default(10)
});

const updatePercentageSchema = z.object({
  contribution_percentage: z.number({ message: 'Contribution percentage must be a number' })
    .int('Percentage must be an integer')
    .min(10, 'Minimum contribution is 10%')
    .max(100, 'Maximum contribution is 100%')
});

/**
 * GET /api/user-charity
 * Retrieve current user's charity selection and contribution percentage
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await charityService.getUserCharitySelection(supabase, user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/user-charity
 * Create or update user's charity selection
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = userCharitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { charity_id, contribution_percentage } = validation.data;
    const { data, error } = await charityService.setUserCharitySelection(
      supabase,
      user.id,
      charity_id,
      contribution_percentage
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/user-charity
 * Update user's selection (charity choice or percentage)
 */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Support partial updates: if charity_id is passed, update selection. If only percentage is passed, update percentage.
    if (body.charity_id) {
      const validation = userCharitySchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      
      const { charity_id, contribution_percentage } = validation.data;
      const { data, error } = await charityService.setUserCharitySelection(
        supabase,
        user.id,
        charity_id,
        contribution_percentage
      );
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    } else {
      const validation = updatePercentageSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      
      const { contribution_percentage } = validation.data;
      const { data, error } = await charityService.updateUserCharityPercentage(
        supabase,
        user.id,
        contribution_percentage
      );
      
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
