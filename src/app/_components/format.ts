/**
 * Hydration-safe formatting shared by the dashboard screens.
 *
 * - Money always goes through Intl.NumberFormat (never a raw float).
 * - Dates pin both locale AND timeZone so server render and client hydration
 *   produce identical strings regardless of the machine's locale/zone.
 */

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    // Unknown/invalid currency code in stored data — degrade to a fixed
    // two-decimal rendering with the code shown separately, never a raw float.
    return `${new Intl.NumberFormat("en", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)} ${currency}`;
  }
}

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

/** Wise transfer statuses arrive in mixed shapes ("PENDING", "COMPLETED",
 *  "incoming_payment_waiting"). Normalize to one sentence-case label and mark
 *  the genuinely-positive (money arrived/sent) states so sentiment colour
 *  carries real meaning, never decoration. */
export function paymentStatus(status: string): {
  label: string;
  positive: boolean;
} {
  const normalized = status.toLowerCase().replace(/_/g, " ").trim();
  const labels: Record<string, string> = {
    "incoming payment waiting": "Awaiting payment",
    "processing": "Processing",
    "pending": "Pending",
    "completed": "Completed",
    "outgoing payment sent": "Sent",
  };
  const label =
    labels[normalized] ??
    normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const positive =
    normalized === "completed" || normalized === "outgoing payment sent";
  return { label, positive };
}
