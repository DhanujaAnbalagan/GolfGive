import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reportService } from '@/services/reportService';

/**
 * GET /api/reports/export
 * Exports tabular reports in CSV or Excel format (Admin only)
 * Query parameters:
 * - type: 'users' | 'subscriptions' | 'revenue' | 'charities' | 'draws' | 'winners'
 * - format: 'csv' | 'excel'
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'users';
    const format = searchParams.get('format') || 'csv';

    let data: Record<string, unknown>[] = [];
    let headers: string[] = [];
    let keys: string[] = [];
    let filename = `report_${type}_${Date.now()}`;

    if (type === 'users') {
      const { data: records } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false });
      
      data = records || [];
      headers = ['ID', 'Full Name', 'Email', 'Role', 'Registered At'];
      keys = ['id', 'full_name', 'email', 'role', 'created_at'];
      filename += fileExtension(format);
    } else if (type === 'subscriptions') {
      const { data: records } = await supabase
        .from('subscriptions')
        .select(`
          id,
          plan_type,
          amount,
          status,
          start_date,
          renewal_date,
          profiles:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      data = (records || []).map((r) => ({
        id: r.id,
        plan_type: r.plan_type,
        amount: r.amount,
        status: r.status,
        start_date: r.start_date,
        renewal_date: r.renewal_date,
        full_name: (r.profiles as { full_name?: string; email?: string } | null)?.full_name || '',
        email: (r.profiles as { full_name?: string; email?: string } | null)?.email || ''
      }));

      headers = ['Subscription ID', 'Player Name', 'Email', 'Plan Type', 'Amount ($)', 'Status', 'Start Date', 'Renewal Date'];
      keys = ['id', 'full_name', 'email', 'plan_type', 'amount', 'status', 'start_date', 'renewal_date'];
      filename += fileExtension(format);
    } else if (type === 'revenue') {
      const { data: records } = await supabase
        .from('subscriptions')
        .select(`
          amount,
          plan_type,
          status,
          start_date,
          profiles:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      data = (records || []).map((r) => ({
        amount: r.amount,
        plan_type: r.plan_type,
        status: r.status,
        start_date: r.start_date,
        full_name: (r.profiles as { full_name?: string; email?: string } | null)?.full_name || '',
        email: (r.profiles as { full_name?: string; email?: string } | null)?.email || ''
      }));

      headers = ['Player Name', 'Email', 'Plan Type', 'Amount Paid ($)', 'Status', 'Transaction Date'];
      keys = ['full_name', 'email', 'plan_type', 'amount', 'status', 'start_date'];
      filename += fileExtension(format);
    } else if (type === 'charities') {
      const { data: records } = await supabase
        .from('user_charities')
        .select(`
          contribution_percentage,
          profiles:user_id(full_name, email),
          charities:charity_id(name)
        `);

      data = (records || []).map((r) => ({
        full_name: (r.profiles as { full_name?: string; email?: string } | null)?.full_name || '',
        email: (r.profiles as { full_name?: string; email?: string } | null)?.email || '',
        charity_name: (r.charities as { name?: string } | null)?.name || '',
        percentage: r.contribution_percentage
      }));

      headers = ['Player Name', 'Email', 'Charity Supported', 'Contribution Share (%)'];
      keys = ['full_name', 'email', 'charity_name', 'percentage'];
      filename += fileExtension(format);
    } else if (type === 'draws') {
      const { data: records } = await supabase
        .from('draw_entries')
        .select(`
          id,
          entry_numbers,
          created_at,
          profiles:user_id(full_name, email),
          draws:draw_id(draw_month, draw_year, draw_type)
        `);

      data = (records || []).map((r) => ({
        id: r.id,
        full_name: (r.profiles as { full_name?: string; email?: string } | null)?.full_name || '',
        email: (r.profiles as { full_name?: string; email?: string } | null)?.email || '',
        draw_period: r.draws ? `${(r.draws as any).draw_month}/${(r.draws as any).draw_year}` : '',
        draw_type: (r.draws as any)?.draw_type || '',
        numbers: Array.isArray(r.entry_numbers) ? (r.entry_numbers as number[]).join('-') : '',
        created_at: r.created_at
      }));

      headers = ['Entry ID', 'Player Name', 'Email', 'Draw Period', 'Draw Type', 'Lucky Numbers', 'Submitted At'];
      keys = ['id', 'full_name', 'email', 'draw_period', 'draw_type', 'numbers', 'created_at'];
      filename += fileExtension(format);
    } else if (type === 'winners') {
      const { data: records } = await supabase
        .from('winners')
        .select(`
          id,
          match_type,
          prize_amount,
          verification_status,
          payment_status,
          created_at,
          profiles:user_id(full_name, email),
          draws:draw_id(draw_month, draw_year)
        `);

      data = (records || []).map((r) => ({
        id: r.id,
        full_name: (r.profiles as { full_name?: string; email?: string } | null)?.full_name || '',
        email: (r.profiles as { full_name?: string; email?: string } | null)?.email || '',
        draw_period: r.draws ? `${(r.draws as any).draw_month}/${(r.draws as any).draw_year}` : '',
        match_type: r.match_type,
        prize: r.prize_amount,
        verification: r.verification_status,
        payment: r.payment_status,
        created_at: r.created_at
      }));

      headers = ['Winner ID', 'Player Name', 'Email', 'Draw Period', 'Matches Count', 'Prize Amount ($)', 'Verification', 'Payment Status', 'Claimed Date'];
      keys = ['id', 'full_name', 'email', 'draw_period', 'match_type', 'prize', 'verification', 'payment', 'created_at'];
      filename += fileExtension(format);
    } else {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    let fileContent = '';
    let contentType = '';

    if (format === 'excel') {
      fileContent = reportService.generateExcel(data, headers, keys);
      contentType = 'application/vnd.ms-excel';
    } else {
      fileContent = reportService.generateCSV(data, headers, keys);
      contentType = 'text/csv';
    }

    return new Response(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

function fileExtension(format: string): string {
  return format === 'excel' ? '.xls' : '.csv';
}
