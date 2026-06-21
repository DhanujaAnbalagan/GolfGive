/**
 * Audit Service
 *
 * Provides server-side audit logging for critical platform actions.
 * Uses the Supabase service-role client to bypass RLS when writing logs.
 *
 * Audit logs are read-only for admins via the /admin/audit page.
 */

import { createClient } from '@supabase/supabase-js';

// Service-role client for writing audit logs (bypasses RLS)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error('Supabase service role credentials are not configured.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.update_profile'
  | 'score.create'
  | 'score.update'
  | 'score.delete'
  | 'draw.create'
  | 'draw.simulate'
  | 'draw.publish'
  | 'subscription.create'
  | 'subscription.cancel'
  | 'winner.verify'
  | 'winner.reject'
  | 'winner.pay'
  | 'charity.create'
  | 'charity.update'
  | 'charity.delete'
  | 'proof.submit';

export interface AuditLogEntry {
  actor_id?: string;
  actor_email?: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Write an audit log entry.
 * Fire-and-forget: errors are logged to console but do not throw.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from('audit_logs').insert(entry);
    if (error) {
      console.warn('[AuditService] Failed to write log:', error.message);
    }
  } catch (err) {
    console.warn('[AuditService] Service unavailable:', err);
  }
}

/**
 * Query audit logs (admin use only).
 */
export interface AuditLogFilters {
  actor_id?: string;
  action?: string;
  entity_type?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const supabase = getServiceClient();

  let query = supabase
    .from('audit_logs')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.actor_id) query = query.eq('actor_id', filters.actor_id);
  if (filters.action) query = query.eq('action', filters.action);
  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.from_date) query = query.gte('created_at', filters.from_date);
  if (filters.to_date) query = query.lte('created_at', filters.to_date);

  query = query
    .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 50) - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { logs: data ?? [], total: count ?? 0 };
}
