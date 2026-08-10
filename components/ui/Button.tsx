import { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-apex-500 text-white shadow-lg shadow-apex-500/20 hover:bg-apex-400',
  secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
  ghost: 'bg-transparent text-slate-200 hover:text-white'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-7 py-3 text-sm',
  lg: 'px-8 py-4 text-sm'
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(
    'cursor-hover inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-300 disabled:cursor-not-allowed disabled:opacity-60',
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, ...props }, ref) => (
    <button ref={ref} disabled={disabled} className={buttonClasses(variant, size, className)} {...props} />
  )
);
Button.displayName = 'Button';

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <a ref={ref} className={buttonClasses(variant, size, className)} {...props} />
  )
);
ButtonLink.displayName = 'ButtonLink';

export { Button, ButtonLink };
