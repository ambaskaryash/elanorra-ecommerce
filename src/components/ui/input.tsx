<<<<<<< HEAD
import * as React from "react"
=======
import * as React from 'react';
>>>>>>> cd4d828afb46635f4e0cae502e32278c42215e8a

import { cn } from "@/lib/utils"

<<<<<<< HEAD
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
=======
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, ...props }, ref) => {
    const baseClasses = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium';
    
    return (
      <input
        type={type}
        className={`${baseClasses} ${className}`}
>>>>>>> cd4d828afb46635f4e0cae502e32278c42215e8a
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
