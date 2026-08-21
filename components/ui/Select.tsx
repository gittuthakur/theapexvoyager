import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <label className="block space-y-2 text-md font-medium text-slate-600" htmlFor={selectId}>
        {label ? <span>{label}</span> : null}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-xl border border-slate-400 bg-slate-50 px-4 py-4 pr-10 text-slate-900 outline-none transition focus:border-apex-400 disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-rose-700',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>
        {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      </label>
    );
  }
);
Select.displayName = 'Select';

export { Select };
