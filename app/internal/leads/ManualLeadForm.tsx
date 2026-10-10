import type { FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LEAD_SOURCES, LEAD_TYPES } from '@/lib/leads';
import { sourceLabel, titleCase } from './leadDisplay';
export function ManualLeadForm({ create, busy, error }: { error: string; create: (e: FormEvent<HTMLFormElement>) => void; busy: boolean }) {
 return <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-4 font-semibold">Create a manual lead</h2>{error ? <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<form onSubmit={create}><fieldset disabled={busy} className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <Input name="name" label="Customer name" required maxLength={200} /><Input name="phone" label="Phone" type="tel" maxLength={30} /><Input name="email" label="Email" type="email" maxLength={200} />
 <Select name="leadType" label="Lead type" defaultValue="JOURNEY">{LEAD_TYPES.map(v => <option key={v} value={v}>{titleCase(v)}</option>)}</Select><Select name="source" label="Reported source" defaultValue="manual">{LEAD_SOURCES.map(v => <option key={v} value={v}>{sourceLabel(v)}</option>)}</Select><Input name="destination" label="Package / destination" maxLength={200} /><Input name="travelStartDate" label="Travel date" type="date" /><Input name="adults" label="Adults (if known)" type="number" min={0} max={100} /><Input name="children" label="Children (if known)" type="number" min={0} max={100} />
 <div className="sm:col-span-2 lg:col-span-3"><Textarea name="message" label="Travel requirements" required maxLength={5000} rows={3} /><p className="mt-2 text-xs text-slate-600">Provide a phone number or email. Leave unknown traveller counts blank.</p></div><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save lead'}</Button></fieldset></form></section>;
}
