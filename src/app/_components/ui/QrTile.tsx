/** A QR code on a high-contrast light tile with a quiet zone — kept light on
 *  every surface (incl. forest) so the code stays scannable and print-clean.
 *  Shows a placeholder while the data URL is still generating. */
export function QrTile({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className="flex h-60 w-60 items-center justify-center rounded-wise-md border border-wise-hairline bg-white text-wise-tertiary">
        Generating QR…
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`h-60 w-60 rounded-wise-md border border-wise-hairline bg-white p-3 ${className}`}
    />
  );
}
