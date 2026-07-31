import { z } from "zod";

import { getServerEnv } from "@/env";
import { ApiError, handle } from "@/lib/api";
import { getDb } from "@/lib/db";

/**
 * Contact / lead submission for the "Hablemos" section.
 *
 * Ported convention from next16-claude-starter: the handler owns the work —
 * validates input, reads a secret env var, and calls an upstream service
 * inline. Secrets are safe here because `route.ts` is never bundled to the
 * browser.
 *
 * Always persisted to `contact_messages` (readable at /portal/mensajes by
 * ADMIN_EMAILS) — that's the durable path now, not a fallback. Forwarding to
 * CONTACT_ENDPOINT (VMA's real inbox/CRM webhook — still unconfirmed, see
 * the note in `src/content/copy.ts`) stays optional on top of that: if it's
 * ever configured, a submission both lands in the DB and gets forwarded; if
 * the forward fails, the DB row still exists rather than the message being
 * silently lost.
 */

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  interest: z.enum(["invertir", "aliado", "otro"]).optional(),
  message: z.string().min(1).max(2000),
});

export const POST = handle(async (req) => {
  const input = contactSchema.parse(await req.json());

  getDb()
    .prepare(
      "INSERT INTO contact_messages (name, email, interest, message) VALUES (?, ?, ?, ?)",
    )
    .run(input.name, input.email, input.interest ?? null, input.message);

  const { CONTACT_ENDPOINT } = getServerEnv();

  if (CONTACT_ENDPOINT) {
    const upstream = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!upstream.ok) {
      throw new ApiError(502, "upstream_error", "Failed to deliver the message.");
    }
  }

  return { received: true };
});
