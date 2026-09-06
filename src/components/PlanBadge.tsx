export function PlanBadge({
  source,
  cached,
}: {
  source: string;
  cached?: boolean;
}) {
  const label =
    source === "safety"
      ? "Safety fallback plan"
      : source === "gemini"
        ? cached
          ? "AI-generated (cached)"
          : "AI-generated"
        : source === "fallback"
          ? "Offline fallback plan"
          : null;
  if (!label) return null;
  const tone =
    source === "safety"
      ? "bg-mod-soft text-moderate"
      : source === "gemini"
        ? "bg-brand-soft text-brand"
        : "bg-soft text-quiet";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}
