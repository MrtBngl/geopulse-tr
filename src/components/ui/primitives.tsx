"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Badge                                                                      */
/* -------------------------------------------------------------------------- */
export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer rounded-md bg-white/[0.055]", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Separator                                                                  */
/* -------------------------------------------------------------------------- */
export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative
      orientation={orientation}
      className={cn(
        "shrink-0 bg-white/[0.08]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                       */
/* -------------------------------------------------------------------------- */
export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-9 w-full items-center gap-1 rounded-xl border border-white/[0.07] bg-black/30 p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "flex-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-slate-400 transition-all",
        "hover:text-slate-200 focus-visible:outline-none",
        "data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-200 data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-cyan-400/30",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Stat pill                                                                  */
/* -------------------------------------------------------------------------- */
export function StatPill({
  label,
  value,
  hint,
  accent = "text-slate-100",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-1.5">
      {icon ? <span className="text-slate-500">{icon}</span> : null}
      <div className="leading-tight">
        <p className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        <p className={cn("font-mono text-sm font-semibold tabular-nums", accent)}>
          {value}
          {hint ? (
            <span className="ml-1 text-[10px] font-normal text-slate-500">{hint}</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
