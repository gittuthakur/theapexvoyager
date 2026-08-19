export interface StepHeaderProps {
  index: number;
  total: number;
  title: string;
  subtitle?: string;
}

export function StepHeader({ index, total, title, subtitle }: StepHeaderProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-apex-600">
        Step {String(index).padStart(2, '0')} of {String(total).padStart(2, '0')}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
