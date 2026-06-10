"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { QrCard } from "~/app/_components/ui/QrCard";

/**
 * The store's pay QR rendered in the signature QR-on-green motif (QrCard).
 * Encodes the absolute /pay/[id] URL — client-side because the absolute
 * origin comes from window.location (same approach as landing-qr.tsx).
 * Used by the store detail page (md) and the printable poster (lg).
 */
export default function StoreQr({
  merchantId,
  merchantName,
  location,
  size = "md",
  className,
}: {
  merchantId: string;
  merchantName: string;
  location?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/pay/${merchantId}`;
    // 640px source keeps the enlarged print rendition crisp; margin 4 is the
    // QR spec's minimum quiet zone — the QR stays sacred.
    void QRCode.toDataURL(url, { width: 640, margin: 4 }).then(setQrDataUrl);
  }, [merchantId]);

  return (
    <QrCard
      qrSrc={qrDataUrl}
      name={merchantName}
      location={location}
      size={size}
      className={className}
    />
  );
}
