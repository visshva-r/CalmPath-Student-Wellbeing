import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-brand text-on-brand hover:bg-brand-hover",
  secondary:
    "border border-line bg-surface text-foreground hover:bg-soft",
  ghost:
    "text-quiet hover:bg-soft hover:text-foreground",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
} as const;

function cx(
  variant: keyof typeof variants,
  size: keyof typeof sizes,
  className = "",
) {
  return `inline-flex items-center justify-center rounded-lg font-semibold transition ${variants[variant]} ${sizes[size]} ${className}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return <button className={cx(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(variant, size, className)}>
      {children}
    </Link>
  );
}
