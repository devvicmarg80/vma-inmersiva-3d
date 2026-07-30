/** Same normalization the import script applies when seeding
 * `approved_users` — must match exactly or a legitimate user's email
 * (typed with different casing/whitespace than the form export) won't
 * resolve against their own row. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
