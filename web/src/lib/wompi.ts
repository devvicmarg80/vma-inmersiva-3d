/**
 * Wompi Web Checkout — the redirect-based flow (no widget/SDK needed,
 * just a URL: https://docs.wompi.co/docs/en/widget-checkout-web). Reads
 * `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, which isn't set yet (no Wompi merchant
 * account as of this writing) — `isWompiConfigured()` lets callers fall
 * back to a real path (the contact form) instead of building a checkout
 * link that would 404 or error at Wompi's end.
 */

export function isWompiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY);
}

export function buildWompiCheckoutUrl({
  amountCOP,
  reference,
  redirectUrl,
}: {
  amountCOP: number;
  /** Must be unique per transaction attempt — Wompi uses this to dedupe. */
  reference: string;
  redirectUrl: string;
}): string {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_WOMPI_PUBLIC_KEY is not configured.");
  }

  const params = new URLSearchParams({
    "public-key": publicKey,
    currency: "COP",
    // Wompi's API represents amounts in the smallest unit ("cents") even
    // for COP, which doesn't have circulating subunits — so this is
    // always amountCOP * 100, not a currency-specific decimal count.
    "amount-in-cents": String(Math.round(amountCOP * 100)),
    reference,
    "redirect-url": redirectUrl,
  });

  return `https://checkout.wompi.co/p/?${params.toString()}`;
}
