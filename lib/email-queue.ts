"use client";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Queues an account email and immediately triggers the send-account-emails
 * Edge Function (which calls Resend). If the function isn't deployed yet,
 * or fails, the row stays in account_email_queue with attempts incremented;
 * an admin can drain it later.
 */
export async function queueAccountEmail(opts: {
  userId: string;
  toEmail: string;
  template:
    | "account_deactivated"
    | "account_reactivated"
    | "deletion_requested"
    | "deletion_completed";
  payload?: Record<string, unknown>;
}) {
  const supa = getSupabaseBrowser();
  if (!supa) return;
  try {
    await (supa as any).from("account_email_queue").insert({
      user_id: opts.userId,
      to_email: opts.toEmail,
      template: opts.template,
      payload: opts.payload ?? {},
    });
    // Fire-and-forget invocation; we don't block the UI on email send
    (supa as any).functions
      .invoke("send-account-emails", { body: {} })
      .catch(() => undefined);
  } catch {
    // Non-fatal — the row stays unsent, admin can drain later
  }
}
