import { type ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-lg">{title}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted italic">{children}</p>;
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}

export const inputClasses =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50";

export const labelClasses = "text-xs font-medium text-muted mb-1 block";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClasses}>{label}</span>
      {children}
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
    >
      {children}
    </button>
  );
}
