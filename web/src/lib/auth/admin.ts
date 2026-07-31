import { getServerEnv } from "@/env";
import { normalizeEmail } from "./normalize";

/** Gates /portal's contact-message inbox — see the ADMIN_EMAILS comment in
 * src/env.ts for why this isn't a DB role. */
export function isAdminEmail(email: string): boolean {
  return getServerEnv().ADMIN_EMAILS.includes(normalizeEmail(email));
}
