import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { charityService } from '@/services/charityService';
import { z } from 'zod';

const charitySchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
  description: z.string({ message: 'Description is required' }).min(1, 'Description is required'),
  image_url: z.string({ message: 'Image URL is required' }).url('Invalid image URL'),
  website_url: z.string().url('Invalid website URL').optional().or(z.literal('')),
  featured: z.boolean().default(false)
});

/**
 * GET /api/charities
 * Fetch all charities (optional: search ?q=..., featured ?featured=true)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const featuredOnly = searchParams.get('featured') === 'true';

    const { data, error } = await charityService.getCharities(supabase, query, featuredOnly);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/charities
 * Create a new charity (Admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role Verification: check profile role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = charitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { data, error } = await charityService.createCharity(supabase, validation.data);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
