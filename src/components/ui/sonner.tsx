"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/lib/utils";

const Toaster = ({ className, toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className={cn("toaster group", className)}
      icons={{
        success: <CircleCheckIcon className="size-5" aria-hidden />,
        info: <InfoIcon className="size-5" aria-hidden />,
        warning: <TriangleAlertIcon className="size-5" aria-hidden />,
        error: <OctagonXIcon className="size-5" aria-hidden />,
        loading: <Loader2Icon className="size-5 animate-spin" aria-hidden />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in oklab, var(--pti-green) 10%, white)",
          "--success-border": "color-mix(in oklab, var(--pti-green) 30%, white)",
          "--success-text": "var(--pti-green)",
          "--info-bg": "color-mix(in oklab, var(--pti-green) 8%, white)",
          "--info-border": "color-mix(in oklab, var(--pti-green) 28%, white)",
          "--info-text": "var(--pti-green-dark)",
          "--warning-bg": "color-mix(in oklab, var(--pti-gold) 18%, white)",
          "--warning-border": "color-mix(in oklab, var(--pti-gold) 45%, white)",
          "--warning-text": "#7a5a00",
          "--error-bg": "color-mix(in oklab, var(--destructive) 10%, white)",
          "--error-border": "color-mix(in oklab, var(--destructive) 30%, white)",
          "--error-text": "var(--destructive)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast: cn("group toast", toastOptions?.classNames?.toast),
          title: toastOptions?.classNames?.title,
          description: toastOptions?.classNames?.description,
          actionButton: cn(
            "!h-9 !rounded-lg !bg-pti-green !px-3.5 !text-sm !font-medium !text-white hover:!bg-pti-green-dark",
            toastOptions?.classNames?.actionButton,
          ),
          cancelButton: cn(
            "!h-9 !rounded-lg !bg-muted !px-3.5 !text-sm !font-medium !text-foreground",
            toastOptions?.classNames?.cancelButton,
          ),
          success: toastOptions?.classNames?.success,
          info: toastOptions?.classNames?.info,
          warning: toastOptions?.classNames?.warning,
          error: toastOptions?.classNames?.error,
          loading: toastOptions?.classNames?.loading,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
