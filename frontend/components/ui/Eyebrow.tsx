import type { ReactNode } from 'react'

export default function Eyebrow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`font-sans font-bold text-[13px] uppercase tracking-[0.16em] text-forest ${className}`}
    >
      {children}
    </span>
  )
}
