import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuditLogs } from '@/services/auditService';

/**
 * GET /api/audit
 * Admin-only: Returns paginated audit log entries.
 * Query params: action, entity_type, from_date, to_date, limit, offset
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    const { logs, total } = await getAuditLogs({
      action: searchParams.get('action') ?? undefined,
      entity_type: searchParams.get('entity_type') ?? undefined,
      from_date: searchParams.get('from_date') ?? undefined,
      to_date: searchParams.get('to_date') ?? undefined,
      limit: parseInt(searchParams.get('limit') ?? '50', 10),
      offset: parseInt(searchParams.get('offset') ?? '0', 10),
    });

    return NextResponse.json({ logs, total }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
