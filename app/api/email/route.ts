import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, EmailTemplate } from '@/services/emailService';

/**
 * POST /api/email
 * Triggers an email notification. Admin or system use only.
 *
 * Body: { to: string, template: EmailTemplate, data?: Record<string, unknown> }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, template, data } = body as {
      to: string;
      template: EmailTemplate;
      data?: Record<string, unknown>;
    };

    if (!to || !template) {
      return NextResponse.json({ error: 'Missing required fields: to, template' }, { status: 400 });
    }

    const result = await sendEmail({ to, template, data });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
