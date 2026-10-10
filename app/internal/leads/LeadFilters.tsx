import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FILTER_PANEL_CLASS } from '@/components/modules/filters/filterStyles';
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES, LEAD_TYPES } from '@/lib/leads';
import { sourceLabel, titleCase } from './leadDisplay';

export type LeadFilterValues = Record<string, string>;
const fieldClass = 'text-sm';
export function LeadFilters({ filters, page, onChange, onReset }: { filters: LeadFilterValues; page: number; onChange: (key: string, value: string) => void; onReset: () => void }) {
  const select = (key: string, label: string, options: readonly string[]) => <Select id={`filter-${key}`} label={label} className={fieldClass} value={filters[key] ?? ''} onChange={e => onChange(key, e.target.value)}><option value="">Any {label.toLowerCase()}</option>{options.map(v => <option key={v} value={v}>{key === 'source' ? sourceLabel(v) : titleCase(v)}</option>)}</Select>;
  return <section aria-label="Lead filters" className={`${FILTER_PANEL_CLASS} p-4 sm:p-6`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Find leads</h2><Button variant="secondary" size="sm" onClick={onReset} disabled={page === 1 && !Object.values(filters).some(Boolean)}>Reset filters</Button></div>
    <Input id="lead-search" label="Customer name / phone" placeholder="Search name, phone, email or package" className={fieldClass} value={filters.q ?? ''} onChange={e => onChange('q', e.target.value)} />
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {select('source', 'Source', LEAD_SOURCES)}{select('status', 'Status', LEAD_STATUSES)}
      <Input id="filter-destination" label="Package / destination" className={fieldClass} value={filters.destination ?? ''} onChange={e => onChange('destination', e.target.value)} />
      <Input id="filter-from" label="Created from" type="date" className={fieldClass} value={filters.from ?? ''} onChange={e => onChange('from', e.target.value)} />
      <Input id="filter-to" label="Created to" type="date" className={fieldClass} value={filters.to ?? ''} onChange={e => onChange('to', e.target.value)} />
      <Select id="filter-followup" label="Follow-up" className={fieldClass} value={filters.followUp ?? ''} onChange={e => onChange('followUp', e.target.value)}>{[['', 'Any follow-up'], ['overdue', 'Overdue'], ['today', 'Due today'], ['upcoming', 'Upcoming'], ['none', 'None scheduled']].map(([v, label]) => <option key={v} value={v}>{label}</option>)}</Select>
    </div>
    <details className="mt-4 text-sm"><summary className="cursor-pointer py-2 font-medium text-slate-700">More filters</summary><div className="mt-2 grid gap-3 sm:grid-cols-2">{select('leadType', 'Type', LEAD_TYPES)}{select('priority', 'Priority', LEAD_PRIORITIES)}</div></details>
  </section>;
}
