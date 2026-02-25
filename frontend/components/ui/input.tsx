import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition-all duration-300",
                    "placeholder:text-muted-foreground",
                    "hover:border-primary/40",
                    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 focus-visible:border-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
