import { z } from "zod";

import { getServerEnv } from "@/env";
import { ApiError, handle } from "@/lib/api";

/**
 * Contact / lead submission for the "Hablemos" section.
 *
 * Ported convention from next16-claude-starter: the handler owns the work —
 * validates input, reads a secret env var, and calls an upstream service
 * inline. Secrets are safe here because `route.ts` is never bundled to the
 * browser.
 *
 * No CONTACT_ENDPOINT is configured yet (VMA's real inbox/CRM webhook is
 * still unconfirmed — see the note in `src/content/copy.ts`), so submissions
 * just get logged server-side until one is wired up via the env var.
 */

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  interest: z.enum(["invertir", "aliado", "otro"]).optional(),
  message: z.string().min(1).max(2000),
});

export const POST = handle(async (req) => {
  const input = contactSchema.parse(await req.json());

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
  } else {
    console.log("[api/contact] submission:", input);
  }

  return { received: true };
});
