import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  to?: string;
  href?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-canvas hover:bg-ink/90 disabled:bg-ink/40',
  accent: 'bg-clay text-white hover:bg-clay-dark disabled:bg-clay/40',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-subtle disabled:text-ink-muted',
  ghost: 'text-ink-soft hover:bg-subtle hover:text-ink disabled:text-ink-muted',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:bg-danger/40',
  link: 'text-clay underline-offset-4 hover:underline px-0 h-auto',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
  icon: 'h-9 w-9 justify-center',
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  to,
  href,
  loading,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const cls = cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-[background-color,color,transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
    variants[variant],
    variant !== 'link' && sizes[size],
    fullWidth && 'w-full',
    className
  );

  const destination = href || to;

  if (destination) {
    return (
      <Link href={destination} className={cls}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export default Button;
