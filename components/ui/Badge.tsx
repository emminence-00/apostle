import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-tag)] px-2 py-1 text-xs font-medium border transition-colors duration-150",
  {
    variants: {
      variant: {
        default:
          "border-[var(--positive)]/25 bg-[var(--positive)]/10 text-[var(--positive)]",
        secondary:
          "border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-secondary)]",
        destructive:
          "border-[var(--negative)]/25 bg-[var(--negative)]/10 text-[var(--negative)]",
        outline:
          "border-[var(--border)] bg-transparent text-[var(--text-muted)]",
        warning:
          "border-[var(--warning)]/25 bg-[var(--warning)]/10 text-[var(--warning)]",
        info:
          "border-[var(--accent)]/25 bg-[var(--accent)]/10 text-[var(--accent)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  status?: string;
}

export function Badge({ className, variant, status, children, ...props }: BadgeProps) {
  let resolvedVariant = variant ?? "default";

  if (status) {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "processed":
        resolvedVariant = "default";
        break;
      case "pending":
        resolvedVariant = "warning";
        break;
      case "failed":
      case "rejected":
        resolvedVariant = "destructive";
        break;
      case "approved":
        resolvedVariant = "info";
        break;
      default:
        resolvedVariant = "secondary";
    }
  }

  return (
    <div className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props}>
      {children ?? status}
    </div>
  );
}

export default Badge;
