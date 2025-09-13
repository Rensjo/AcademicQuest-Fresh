import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { soundService } from "@/services/soundService"
import { buttonVariants } from "./button-variants"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  soundEnabled?: boolean // Option to disable sound for specific buttons
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, soundEnabled = true, onMouseEnter, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundEnabled) {
        soundService.playHover()
      }
      onMouseEnter?.(e)
    }
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundEnabled) {
        soundService.playClick()
      }
      onClick?.(e)
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
