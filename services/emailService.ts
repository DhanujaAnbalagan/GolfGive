/**
 * Email Service (Mock Implementation)
 *
 * Provides a structured email API with console-based logging.
 * Replace `sendEmail()` internals with your real provider:
 *   - Resend:     https://resend.com
 *   - Sendgrid:   https://sendgrid.com
 *   - Nodemailer: https://nodemailer.com
 *
 * All emails are logged to console in development.
 * In production, swap the mock for a real provider without changing callers.
 */

export type EmailTemplate =
  | 'welcome'
  | 'subscription_confirmed'
  | 'subscription_cancelled'
  | 'draw_entered'
  | 'winner_notification'
  | 'proof_submission_received'
  | 'proof_approved'
  | 'proof_rejected'
  | 'payment_processed'
  | 'password_reset';

export interface EmailPayload {
  to: string;
  template: EmailTemplate;
  data?: Record<string, unknown>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Template Definitions ─────────────────────────────────────────────────────

const EMAIL_TEMPLATES: Record<EmailTemplate, { subject: string; preview: string }> = {
  welcome: {
    subject: 'Welcome to GolfGive! ⛳',
    preview: 'Your account has been created. Start tracking your golf scores today.',
  },
  subscription_confirmed: {
    subject: 'Subscription Confirmed – GolfGive',
    preview: 'You are now an active subscriber and eligible for monthly draws.',
  },
  subscription_cancelled: {
    subject: 'Subscription Cancelled – GolfGive',
    preview: 'Your subscription has been cancelled. You can re-subscribe at any time.',
  },
  draw_entered: {
    subject: 'You Have Entered This Month\'s Draw! 🎰',
    preview: 'Good luck! Draw results are announced at the end of the month.',
  },
  winner_notification: {
    subject: '🏆 You Won! Claim Your Prize – GolfGive',
    preview: 'Congratulations! You have matched winning numbers in the monthly draw.',
  },
  proof_submission_received: {
    subject: 'Proof Received – Under Review',
    preview: 'We have received your proof of eligibility and will review it shortly.',
  },
  proof_approved: {
    subject: '✅ Proof Approved – Payment Processing',
    preview: 'Your proof of eligibility has been approved. Payment is being processed.',
  },
  proof_rejected: {
    subject: '⚠️ Proof Rejected – Action Required',
    preview: 'Your proof submission was rejected. Please review and resubmit.',
  },
  payment_processed: {
    subject: '💷 Payment Processed – GolfGive',
    preview: 'Your prize payment has been processed successfully.',
  },
  password_reset: {
    subject: 'Reset Your GolfGive Password',
    preview: 'Click the link below to reset your password. Link expires in 1 hour.',
  },
};

// ─── Core Send Function ───────────────────────────────────────────────────────

/**
 * Send an email using the configured provider.
 * Currently: mock (console log). Swap internals for a real provider.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const template = EMAIL_TEMPLATES[payload.template];

  if (!template) {
    return { success: false, error: `Unknown email template: ${payload.template}` };
  }

  const messageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // ── MOCK: Log to console ──────────────────────────────────────────────────
  console.log('\n📧 [EmailService] Sending email:');
  console.log(`   To:       ${payload.to}`);
  console.log(`   Template: ${payload.template}`);
  console.log(`   Subject:  ${template.subject}`);
  console.log(`   Preview:  ${template.preview}`);
  if (payload.data) console.log('   Data:    ', JSON.stringify(payload.data, null, 2));
  console.log(`   ID:       ${messageId}`);
  // ─────────────────────────────────────────────────────────────────────────

  // TODO: Replace above with real provider, e.g.:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // const { data, error } = await resend.emails.send({
  //   from: 'GolfGive <noreply@golfgive.com>',
  //   to: payload.to,
  //   subject: template.subject,
  //   html: renderTemplate(payload.template, payload.data),
  // });

  return { success: true, messageId };
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

export const EmailService = {
  sendWelcome: (to: string, name: string) =>
    sendEmail({ to, template: 'welcome', data: { name } }),

  sendSubscriptionConfirmed: (to: string, plan: string) =>
    sendEmail({ to, template: 'subscription_confirmed', data: { plan } }),

  sendSubscriptionCancelled: (to: string) =>
    sendEmail({ to, template: 'subscription_cancelled' }),

  sendDrawEntered: (to: string, drawMonth: number, drawYear: number) =>
    sendEmail({ to, template: 'draw_entered', data: { drawMonth, drawYear } }),

  sendWinnerNotification: (to: string, prizeAmount: number) =>
    sendEmail({ to, template: 'winner_notification', data: { prizeAmount } }),

  sendProofReceived: (to: string) =>
    sendEmail({ to, template: 'proof_submission_received' }),

  sendProofApproved: (to: string, prizeAmount: number) =>
    sendEmail({ to, template: 'proof_approved', data: { prizeAmount } }),

  sendProofRejected: (to: string, reason: string) =>
    sendEmail({ to, template: 'proof_rejected', data: { reason } }),

  sendPaymentProcessed: (to: string, amount: number) =>
    sendEmail({ to, template: 'payment_processed', data: { amount } }),
};

export default EmailService;
