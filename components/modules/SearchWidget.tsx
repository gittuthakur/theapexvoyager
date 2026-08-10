'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface SearchWidgetProps {
  destinations: string[];
  onSearch?: (query: { destination: string; dates: string; guests: number }) => void;
  className?: string;
}

export default function SearchWidget({ destinations, onSearch, className }: SearchWidgetProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(destinations[0] ?? '');
  const [dates, setDates] = useState('');
  const [guests, setGuests] = useState(2);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchQuery = { destination, dates, guests };
    if (onSearch) {
      onSearch(searchQuery);
      return;
    }

    const params = new URLSearchParams({
      destination: searchQuery.destination,
      dates: searchQuery.dates,
      guests: searchQuery.guests.toString()
    });

    router.push(`/tours?${params.toString()}`);
  }

  return (
    <GlassCard as="section" className={className ?? 'p-6 sm:p-8'}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1.2fr_1fr_0.6fr_auto] sm:items-end">
        <label className="space-y-2 text-sm text-slate-300">
          <span>Destination</span>
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-apex-400"
          >
            {destinations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <Input label="Travel dates" name="dates" placeholder="e.g. Oct 12 - Oct 20" value={dates} onChange={(event) => setDates(event.target.value)} />
        <Input
          label="Guests"
          name="guests"
          type="number"
          min={1}
          value={guests}
          onChange={(event) => setGuests(Number(event.target.value))}
        />
        <Button type="submit" size="lg" className="sm:h-[52px]">
          <Search size={18} />
          Search
        </Button>
      </form>
    </GlassCard>
  );
}
