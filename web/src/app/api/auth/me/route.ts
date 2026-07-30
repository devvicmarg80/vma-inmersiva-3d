import { handle } from "@/lib/api";
import { getSession } from "@/lib/auth/session";

export const GET = handle(async () => {
  const session = await getSession();
  return { email: session?.email ?? null };
});
