import type { ReactNode } from 'react'

export default function Badge({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-block rounded-full bg-mint-soft text-forest font-bold text-[12px] uppercase tracking-[0.08em] px-3 py-[5px] ${className}`}
    >
      {children}
    </span>
  )
}
