import * as React from "react"
import { cn } from "../../lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-[#e0dedb] bg-white px-3 py-2 text-sm text-[#37322f] placeholder:text-[#605a57]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#37322f] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
