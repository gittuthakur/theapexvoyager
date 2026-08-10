import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const fieldStyles =
  'w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-apex-400';

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-2 text-sm text-slate-300" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input ref={ref} id={inputId} className={cn(fieldStyles, error && 'border-rose-500', className)} {...props} />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
});
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, error, id, ...props }, ref) => {
  const textareaId = id ?? props.name;
  return (
    <label className="block space-y-2 text-sm text-slate-300" htmlFor={textareaId}>
      {label ? <span>{label}</span> : null}
      <textarea ref={ref} id={textareaId} className={cn(fieldStyles, error && 'border-rose-500', className)} {...props} />
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
});
Textarea.displayName = 'Textarea';

export { Input, Textarea };
