"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { PillButton } from "~/app/_components/ui/PillButton";

/**
 * Compact QR-on-green tile for the dashboard store list: a mini pay QR on the
 * bright green action surface with a forest "View & print" pill into the
 * owner-only detail page. The pill keeps "View store" as its accessible name
 * (e2e contract) while the visible label invites the print action.
 */
export default function StoreMiniQr({
  merchantId,
  merchantName,
}: {
  merchantId: string;
  merchantName: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/pay/${merchantId}`;
    // Small on screen but generated large so it stays crisp; margin 4 is the
    // QR spec's minimum quiet zone.
    void QRCode.toDataURL(url, { width: 320, margin: 4 }).then(setQrDataUrl);
  }, [merchantId]);

  return (
    <div className="flex w-full max-w-[200px] flex-col items-stretch gap-3 rounded-3xl bg-wise-green p-4">
      <div className="flex items-center justify-center rounded-2xl bg-white p-2">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`Pay QR code for ${merchantName}`}
            className="h-24 w-24 bg-white"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center text-center text-[13px] text-wise-tertiary">
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
