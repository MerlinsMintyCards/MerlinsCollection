/**
 * Gradient stand-in for imagery that isn't wired up yet. Exposed to assistive
 * tech as an image via `role="img"` + `aria-label`; the visible label text is
 * `aria-hidden` so it isn't announced twice.
 */
export default function ImagePlaceholder({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`flex items-center justify-center text-center text-white text-[12px] font-semibold p-3 bg-gradient-to-br from-forest-mid to-forest-deep ${className}`}
    >
      <span aria-hidden="true">{label}</span>
    </div>
  )
}
