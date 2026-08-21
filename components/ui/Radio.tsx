import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

// Radios in a group share `name`, so id falls back to `name-value` rather than
// Input's `id ?? name` — that fallback alone would give every option in a group
// the same id.
const Radio = forwardRef<HTMLInputElement, RadioProps>(({ className, label, id, disabled, ...props }, ref) => {
  const radioId = id ?? [props.name, props.value].filter(Boolean).join('-');
  return (
    <label
      htmlFor={radioId}
      className={cn(
        'inline-flex cursor-pointer items-center gap-3 text-md text-slate-700',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input ref={ref} id={radioId} type="radio" disabled={disabled} className="peer sr-only" {...props} />
        <span
          className={cn(
            'absolute inset-0 rounded-full border border-slate-400 bg-slate-50 transition',
            'peer-checked:border-apex-500',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-apex-300 peer-focus-visible:ring-offset-2'
          )}
        />
        <span className="relative z-10 h-2 w-2 scale-0 rounded-full bg-apex-500 transition peer-checked:scale-100" />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
});
Radio.displayName = 'Radio';

export { Radio };
