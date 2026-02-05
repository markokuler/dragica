import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input-border placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/30 aria-invalid:ring-destructive/20 aria-invalid:border-destructive bg-input flex field-sizing-content min-h-24 w-full rounded-lg border px-4 py-3 text-base shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
