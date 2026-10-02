'use client';
import { useState } from 'react';
import type { CostingInput, JourneyContext } from '@/models/JourneyCosting';
import { quoteRequest } from '@/services/pricing/supplierCoverage.service';
import { LibraryFields, internalInput, internalButton } from './SupplierLibraryFields';
export default function SupplierQuoteHelper({ journey, input }: { journey: JourneyContext; input: CostingInput }) {
  const [kind, setKind] = useState<'HOTEL' | 'TRANSPORT'>('HOTEL'); const [values, setValues] = useState({ destination: '', nights: 0, mealPlan: '', vehicle: '', approximateKm: null as number | null });
  const text = quoteRequest(journey, { ...values, kind, travelFrom: input.validFrom, travelTo: input.validTo, season: input.travelSeason, rooms: input.roomCount, adults: input.adultCount, children: input.childCount });
  const [message, setMessage] = useState('');
  return <section className="min-w-0 rounded-xl border bg-white p-5"><h2 className="mb-3 text-lg font-semibold">Supplier quote request helper</h2><label className="text-xs">Request type<select aria-label="Quote request type" className={internalInput} value={kind} onChange={e => setKind(e.target.value as 'HOTEL' | 'TRANSPORT')}><option>HOTEL</option><option>TRANSPORT</option></select></label><div className="my-3"><LibraryFields value={values} omit={kind === 'HOTEL' ? ['vehicle', 'approximateKm'] : ['destination', 'nights', 'mealPlan']} onChange={patch => setValues(v => ({ ...v, ...patch }))} /></div><textarea aria-label="Generated supplier quote request" className={`${internalInput} h-72`} readOnly value={text} /><button type="button" className={`${internalButton} mt-3`} onClick={async () => { try { await navigator.clipboard.writeText(text); setMessage('Copied request text; nothing sent.'); } catch { setMessage('Select and copy the request text manually.'); } }}>Copy quote request text</button><p className="mt-2 text-xs">Text only. No email/WhatsApp is sent, no booking is created. {message}</p></section>;
}
