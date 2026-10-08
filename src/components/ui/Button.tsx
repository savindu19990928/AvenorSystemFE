import React from "react";
import { Loader2Icon, BoxIcon } from "lucide-react";
import { cx } from "../../utils/styles";
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: BoxIcon;
}
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong shadow-sm',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas shadow-sm',
  ghost: 'text-muted hover:text-ink hover:bg-canvas',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm'
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2'
};
export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} disabled={disabled || loading} className={cx('inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50', variants[variant], sizes[size], className)} {...rest}>
      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />}
      {children}
    </button>;
}