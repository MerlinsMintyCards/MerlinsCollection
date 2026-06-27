import type { ReactNode } from 'react'

/** Centers page content and caps it at the site's max width with responsive gutters. */
export default function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mx-auto w-full max-w-[1140px] px-5 sm:px-7 ${className}`}>{children}</div>
}
