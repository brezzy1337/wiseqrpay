"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { QrTile } from "~/app/_components/ui/QrTile";

/**
 * The store's pay QR — encodes the absolute /pay/[id] URL. Client-side because
 * the absolute origin comes from window.location (same approach as the
 * onboarding success panel). Carries print-keep so the tile survives printing.
 */
export default function StoreQr({
  merchantId,
  merchantName,
}: {
  merchantId: string;
  merchantName: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/pay/${merchantId}`;
    // 640px source keeps the enlarged print rendition crisp; margin 4 is the
    // QR spec's minimum quiet zone.
    void QRCode.toDataURL(url, { width: 640, margin: 4 }).then(setQrDataUrl);
  }, [merchantId]);

  return (
    // In print the code fills most of the printable width so it scans from
    // across the counter; on screen it stays the standard 240px tile.
    <QrTile
      src={qrDataUrl}
      alt={`Pay QR code for ${merchantName}`}
      className="print-keep print:h-96 print:w-96"
    />
  );
}
