import * as React from 'react'

import { cn } from '@/lib/utils'

/** text-input (DESIGN.md): radio 6px, borde hairline-input, foco en primary. */
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-sm border border-hairline-input bg-canvas px-3 text-base text-ink outline-none transition-colors placeholder:text-ink-mute focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
