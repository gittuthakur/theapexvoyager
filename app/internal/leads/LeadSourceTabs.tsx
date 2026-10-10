import { useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { filterTriggerClass } from '@/components/modules/filters/filterStyles';
import { LEAD_SOURCES } from '@/lib/leads';
import type { LeadSummary } from '@/services/leads/lead.service';
import { sourceLabel } from './leadDisplay';

export const sourceTabId = (source = '') => `lead-source-${encodeURIComponent(source || 'all')}`;

export function LeadSourceTabs({ summary, source, onChange }: {
  summary: LeadSummary; source: string; onChange: (source: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const sources = [...new Set([...Object.keys(summary.bySource), ...(source ? [source] : [])])]
    .sort((a, b) => {
      const order = (value: string) => {
        const index = (LEAD_SOURCES as readonly string[]).indexOf(value);
        return index < 0 ? LEAD_SOURCES.length : index;
      };
      return order(a) - order(b) || a.localeCompare(b);
    });
  const tabs = [{ source: '', label: 'All Leads', count: summary.total },
    ...sources.map(value => ({ source: value, label: sourceLabel(value), count: summary.bySource[value] ?? 0 }))];
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next].source);
  }
  return <div role="tablist" aria-label="Lead sources" aria-orientation="horizontal" className="mt-4 flex flex-wrap gap-2">
    {tabs.map((tab, index) => <Button key={tab.source} ref={el => { refs.current[index] = el; }}
      type="button" variant="secondary" role="tab" id={sourceTabId(tab.source)}
      aria-selected={source === tab.source} aria-controls="lead-results" tabIndex={source === tab.source ? 0 : -1}
      className={filterTriggerClass(source === tab.source, 'min-h-11')}
      onKeyDown={event => navigate(event, index)} onClick={() => onChange(tab.source)}>
      {tab.label}<span className={source === tab.source ? 'rounded-full bg-white/20 px-2 py-0.5 text-xs' : 'rounded-full bg-white px-2 py-0.5 text-xs'}>{tab.count}</span>
    </Button>)}
  </div>;
}
