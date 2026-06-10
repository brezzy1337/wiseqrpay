"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { QrCard } from "~/app/_components/ui/QrCard";

/**
 * The landing hero's illustrative QR-on-green card. Encodes the seeded demo
 * shop's pay URL (/pay/merchant-demo-1) so a scan of the hero actually lands
 * somewhere real. Client-side because the absolute origin comes from
 * window.location — same approach as store-qr.tsx.
 */
export default function LandingQr() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/pay/merchant-demo-1`;
    // margin 4 is the QR spec's minimum quiet zone — the QR stays sacred.
    void QRCode.toDataURL(url, { width: 640, margin: 4 }).then(setQrDataUrl);
  }, []);

  return (
    <QrCard
      qrSrc={qrDataUrl}
      name="Acme Coffee Shop"
      location="Singapore"
      size="md"
      className="motion-safe:animate-fade-up"
    />
  );
}
