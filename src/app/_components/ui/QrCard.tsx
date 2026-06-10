type QrSize = "sm" | "md" | "lg";

// Fixed Tailwind sizes keep the QR crisp and on the 8pt grid.
const QR_SIZES: Record<QrSize, string> = {
  sm: "h-40 w-40",
  md: "h-56 w-56",
  lg: "h-72 w-72",
};

/** The signature QR-on-green motif: a white QR card sitting on a bright green
 *  card (r32). Repeats on landing, dashboard tile, and the poster — always via
 *  this component, never re-implemented per screen. The QR itself stays
 *  sacred: white quiet zone, dark modules, nothing bleeding in. */
export function QrCard({
  qrSrc,
  name,
  location,
  size = "md",
  className = "",
}: {
  qrSrc: string | null;
  name: string;
  location?: string;
  size?: QrSize;
  className?: string;
}) {
  return (
    <div className={`rounded-[32px] bg-wise-green p-6 ${className}`}>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4">
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt={`Pay QR code for ${name}`}
            className={`${QR_SIZES[size]} bg-white`}
          />
        ) : (
          <div
            className={`flex ${QR_SIZES[size]} items-center justify-center text-wise-tertiary`}
          >
            Generating QR…
          </div>
        )}
        <div className="text-center">
          <p className="text-base font-semibold text-wise-content">{name}</p>
          {location ? (
            <p className="text-[13px] text-wise-tertiary">{location}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
