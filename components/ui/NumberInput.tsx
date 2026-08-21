'use client';

import { InputHTMLAttributes, forwardRef, useImperativeHandle, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, label, error, id, disabled, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);
    const numberId = id ?? props.name;

    // Controlled inputs read their value through React's own tracked setter, so
    // assigning el.value directly (via stepUp/stepDown) is invisible to onChange.
    // Going through the native prototype setter before dispatching 'input' is the
    // standard way to make a programmatic change look identical to a user keystroke.
    const step = (direction: 1 | -1) => {
      const el = innerRef.current;
      if (!el) return;
      direction === 1 ? el.stepUp() : el.stepDown();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      nativeSetter?.call(el, el.value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    return (
      <label className="block space-y-2 text-md font-medium text-slate-600" htmlFor={numberId}>
        {label ? <span>{label}</span> : null}
        <div
          className={cn(
            'flex items-stretch overflow-hidden rounded-xl border border-slate-400 bg-slate-50 transition focus-within:border-apex-400',
            error && 'border-rose-700',
            disabled && 'opacity-60'
          )}
        >
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => step(-1)}
            aria-label="Decrease"
            className="flex w-11 shrink-0 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none"
          >
            <Minus size={16} />
          </button>
          <input
            ref={innerRef}
            id={numberId}
            type="number"
            disabled={disabled}
            className={cn(
              'w-full border-x border-slate-400 bg-transparent px-2 py-4 text-center text-slate-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
              className
            )}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => step(1)}
            aria-label="Increase"
            className="flex w-11 shrink-0 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none"
          >
            <Plus size={16} />
          </button>
        </div>
        {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      </label>
    );
  }
);
NumberInput.displayName = 'NumberInput';

export { NumberInput };
