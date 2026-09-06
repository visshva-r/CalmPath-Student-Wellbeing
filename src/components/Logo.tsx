export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <path
        d="M7 21c3.5-9 5.5-4 8.5 0s5 8 9.5-1"
        stroke="currentColor"
        className="text-on-brand"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-foreground">
      <LogoMark />
      {compact ? null : (
        <span className="text-[15px] font-semibold tracking-tight">CalmPath</span>
      )}
    </span>
  );
}
