"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { PillButton } from "~/app/_components/ui/PillButton";

/**
 * Compact QR-on-green tile for the dashboard store list: a mini pay QR on the
 * bright green action surface with a forest "View & print" pill into the
 * owner-only detail page. The pill keeps "View store" as its accessible name
 * (e2e contract) while the visible label invites the print action.
 *
 * `hero` renders the larger r32 hero-card treatment (wider tile, bigger QR)
 * — used by the personal-QR card so the default QR visibly outranks the
 * business minis.
 */
export default function StoreMiniQr({
  merchantId,
  merchantName,
  hero = false,
}: {
  merchantId: string;
  merchantName: string;
  hero?: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/pay/${merchantId}`;
    // Small on screen but generated large so it stays crisp; margin 4 is the
    // QR spec's minimum quiet zone.
    void QRCode.toDataURL(url, { width: 320, margin: 4 }).then(setQrDataUrl);
  }, [merchantId]);

  // Hero = the r32 green hero-card rule (rounded-wise-hero matches QrCard);
  // mini = the compact r24 list tile. Sizes stay on the 8pt grid.
  const qrSize = hero ? "h-32 w-32" : "h-24 w-24";

  return (
    <div
      className={`flex w-full flex-col items-stretch gap-3 bg-wise-green ${
        hero ? "max-w-64 rounded-wise-hero p-6" : "max-w-52 rounded-3xl p-4"
      }`}
    >
      <div className="flex items-center justify-center rounded-2xl bg-white p-2">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`Pay QR code for ${merchantName}`}
            className={`${qrSize} bg-white`}
          />
        ) : (
          <div
            className={`flex ${qrSize} items-center justify-center text-center text-[13px] text-wise-tertiary`}
          >
            Generating QR…
          </div>
        )}
      </div>
      <PillButton
        href={`/dashboard/${merchantId}`}
        variant="dark"
        fullWidth
        aria-label="View store"
      >
        View &amp; print
      </PillButton>
    </div>
  );
}
