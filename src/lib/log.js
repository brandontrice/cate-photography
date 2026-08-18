import { supabase, DEMO } from "./supabase";

// Fire-and-forget activity logging. Never blocks or breaks the action it
// records; a failed log entry is a shrug, not an error.
export async function logAction(action, subject = "", details = "") {
  if (DEMO) return;
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from("site_log").insert({
      author: data.session?.user?.email || null,
      action,
      subject,
      details,
    });
  } catch {
    /* logging must never take the site down */
  }
}
