import { InputHTMLAttributes, forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

// className styles the wrapper label, not the (visually hidden) native input —
// the visible box is a peer-checked sibling, so there's nothing to style on the input itself.
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, id, disabled, ...props }, ref) => {
  const checkboxId = id ?? props.name;
  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        'inline-flex cursor-pointer items-center gap-3 text-md text-slate-700',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input ref={ref} id={checkboxId} type="checkbox" disabled={disabled} className="peer sr-only" {...props} />
        <span
          className={cn(
            'absolute inset-0 rounded-md border border-slate-400 bg-slate-50 transition',
            'peer-checked:border-apex-500 peer-checked:bg-apex-500',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-apex-300 peer-focus-visible:ring-offset-2'
          )}
        />
        <Check size={13} strokeWidth={3} className="relative z-10 text-white opacity-0 transition peer-checked:opacity-100" />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
