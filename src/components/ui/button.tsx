"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-500/15 text-cyan-200 ring-1 ring-inset ring-cyan-400/30 hover:bg-cyan-500/25 hover:ring-cyan-300/50",
        ghost: "text-slate-400 hover:bg-white/5 hover:text-slate-100",
        outline:
          "border border-white/10 bg-white/[0.02] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200",
        danger:
          "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30 hover:bg-red-500/25",
        subtle: "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        xs: "h-7 px-2.5 text-[11px]",
        icon: "h-9 w-9",
        iconSm: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
