'use client';

import { FormEvent, useState } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { postJSON } from '@/lib/api';

const STATES = ['Himachal Pradesh', 'Jammu & Kashmir', 'Uttarakhand'];

const PARTNER_TYPES = ['Cab Operator', 'Tempo / Fleet Operator', 'Self-Drive Rental', '4x4 Operator', 'Bike Rental', 'Local Transport Provider'];

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function TransportPartnerForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [application, setApplication] = useState<{ id: string; status: string } | null>(null);
  const [withDriver, setWithDriver] = useState(false);
  const [selfDrive, setSelfDrive] = useState(false);
  // A partner can genuinely run more than one business (e.g. Cab + 4x4 + Bike) — never
  // forced into picking just one.
  const [partnerTypes, setPartnerTypes] = useState<string[]>([]);

  function togglePartnerType(type: string) {
    setPartnerTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : [...current, type]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    const form = new FormData(event.currentTarget);
    const serviceAreas = String(form.get('serviceAreas') ?? '')
      .split(',')
      .map((area) => area.trim())
      .filter(Boolean);
    const vehicleTypes = String(form.get('vehicleTypes') ?? '')
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean);
    const operatingRoutes = String(form.get('operatingRoutes') ?? '')
      .split(',')
      .map((route) => route.trim())
      .filter(Boolean);
    const numberOfVehiclesRaw = form.get('numberOfVehicles');
    const numberOfVehicles = numberOfVehiclesRaw ? Number(numberOfVehiclesRaw) : undefined;

    if (partnerTypes.length === 0) {
      setStatus('error');
      setErrorMessage('Select at least one partner type.');
      return;
    }

    try {
      const response = await postJSON<{ id: string; status: string }>('/api/transport/partners', {
        businessName: form.get('businessName'),
        phone: form.get('phone'),
        whatsapp: form.get('whatsapp') || undefined,
        email: form.get('email') || undefined,
        state: form.get('state'),
        city: form.get('city'),
        serviceAreas,
        partnerTypes,
        vehicleTypes,
        numberOfVehicles: Number.isFinite(numberOfVehicles) ? numberOfVehicles : undefined,
        operatingRoutes,
        withDriver,
        selfDrive,
        basicPricingInfo: form.get('basicPricingInfo') || undefined,
        documentsNote: form.get('documentsNote') || undefined
      });
      setApplication(response);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong — please try again, or message us directly on WhatsApp.');
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          {application?.status === 'pending' ? 'Pending Verification' : application?.status ?? 'Received'}
        </p>
        {application?.id ? <p className="mt-2 text-sm">Application ID: {application.id}</p> : null}
        <p className="mt-3">Thanks — we&apos;ve received your details and our partnerships team will verify and reach out shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
      <Input label="Owner / Business Name" name="businessName" required />
      <Input label="Phone" name="phone" type="tel" required />
      <Input label="WhatsApp Number" name="whatsapp" type="tel" />
      <Input label="Email" name="email" type="email" />

      <Select label="State" name="state" required defaultValue="">
        <option value="" disabled>
          Select a state
        </option>
        {STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </Select>
      <Input label="City" name="city" required />

      <Textarea
        label="Service Areas"
        name="serviceAreas"
        placeholder="e.g. Manali, Kullu Valley, Himachal Pradesh (comma-separated)"
        className="sm:col-span-2"
        rows={2}
      />

      <div className="sm:col-span-2">
        <p className="text-sm font-medium text-slate-700">Partner Type(s)</p>
        <p className="text-xs text-slate-500">Select every business you offer — e.g. a Manali operator can be Cab + 4x4 + Bike.</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
          {PARTNER_TYPES.map((type) => (
            <Checkbox key={type} label={type} checked={partnerTypes.includes(type)} onChange={() => togglePartnerType(type)} />
          ))}
        </div>
      </div>

      <Input label="Vehicle Types" name="vehicleTypes" placeholder="e.g. Sedan, SUV, Royal Enfield (comma-separated)" />
      <Input label="Number of Vehicles" name="numberOfVehicles" type="number" min={1} />

      <Textarea
        label="Operating Routes"
        name="operatingRoutes"
        placeholder="e.g. Chandigarh - Manali, Manali - Spiti Valley (comma-separated)"
        className="sm:col-span-2"
        rows={2}
      />

      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <Checkbox label="With Driver" checked={withDriver} onChange={(event) => setWithDriver(event.target.checked)} />
        <Checkbox label="Self-Drive" checked={selfDrive} onChange={(event) => setSelfDrive(event.target.checked)} />
      </div>

      <Textarea
        label="Basic Pricing Information"
        name="basicPricingInfo"
        placeholder="Any starting rates or pricing notes you'd like to share"
        className="sm:col-span-2"
        rows={3}
      />

      <Textarea
        label="Documents Available (optional notes)"
        name="documentsNote"
        placeholder="e.g. Vehicle RC, permit, driving licence, insurance — list what you can provide"
        className="sm:col-span-2"
        rows={2}
      />

      {status === 'error' ? <p className="text-sm text-rose-600 sm:col-span-2">{errorMessage}</p> : null}

      <Button type="submit" size="lg" disabled={status === 'sending'} className="sm:col-span-2 justify-center">
        {status === 'sending' ? 'Submitting…' : 'Submit Partner Application'}
      </Button>
    </form>
  );
}
