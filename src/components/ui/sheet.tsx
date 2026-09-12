"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SheetContextValue {
  open: boolean;
}

const SheetContext = React.createContext<SheetContextValue>({ open: false });

export function Sheet({
  open,
  onOpenChange,
  children,
  modal = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  modal?: boolean;
}) {
  return (
    <SheetContext.Provider value={{ open }}>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
        {children}
      </DialogPrimitive.Root>
    </SheetContext.Provider>
  );
}

/**
 * Sağdan açılan cam panel. Framer Motion `AnimatePresence` ile
 * çıkış animasyonu korunur, Radix `forceMount` ile DOM kontrolü bize geçer.
 */
export function SheetContent({
  className,
  children,
  side = "right",
}: {
  className?: string;
  children: React.ReactNode;
  side?: "right" | "left";
}) {
  const { open } = React.useContext(SheetContext);
  const offset = side === "right" ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {open ? (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-none fixed inset-0 z-40 bg-gradient-to-l from-black/70 via-black/20 to-transparent"
            />
          </DialogPrimitive.Overlay>

          <DialogPrimitive.Content
            asChild
            forceMount
            onInteractOutside={(event) => event.preventDefault()}
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ x: offset, opacity: 0.3 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: offset, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 32, mass: 0.9 }}
              className={cn(
                "fixed top-0 z-50 flex h-dvh w-full flex-col overflow-hidden border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.7)]",
                "glass sm:w-[420px]",
                side === "right" ? "right-0 border-l" : "left-0 border-r",
                className,
              )}
            >
              {children}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  );
}

export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
export const SheetClose = DialogPrimitive.Close;
