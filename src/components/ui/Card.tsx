import type { ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_0_rgb(0_0_0/0.03)] ${className}`}
    >
      {title ? (
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      ) : null}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

export function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full px-6 py-10 text-foreground ${wide ? "max-w-5xl" : "max-w-3xl"}`}
    >
      {children}
    </div>
  );
}
