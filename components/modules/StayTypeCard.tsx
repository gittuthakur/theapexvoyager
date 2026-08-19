import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { stayTypes, type StayTypeDefinition } from '@/config/stayTypes.config';

export interface StayTypeCardProps {
  types?: StayTypeDefinition[];
}

// "Heritage Stays" is a real, working route but isn't one of the hub's named
// stay types — it's surfaced instead via the editorial section further down.
const defaultTypes = stayTypes.filter((type) => type.slug !== 'heritage');

export default function StayTypeCard({ types = defaultTypes }: StayTypeCardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
      {types.map((type) => (
        <Link
          key={type.slug}
          href={`/stays/${type.slug}`}
          className="group relative block h-64 shrink-0 snap-start overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 transition-transform duration-300 ease-out hover:-translate-y-1 sm:h-64 sm:w-auto sm:shrink"
        >
          <SafeImage
            src={type.image}
            alt={`${type.label} in the Himalayas`}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 72vw"
            className="object-cover transition duration-300 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1830] via-[#0D1830]/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="text-xl font-bold text-white">{type.label}</h3>
            <p className="mt-1 line-clamp-2 text-md text-slate-200">{type.description}</p>
            <span className="mt-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition group-hover:bg-apex-500">
              <ArrowUpRight size={24} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
