import Link from 'next/link';
import { stayMoods, type StayMoodDefinition } from '@/config/stayMoods.config';

export interface StayMoodCardProps {
  moods?: StayMoodDefinition[];
}

export default function StayMoodCard({ moods = stayMoods }: StayMoodCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {moods.map((mood) => {
        const Icon = mood.icon;
        return (
          <Link
            key={mood.slug}
            href={`/stays/search?mood=${mood.slug}`}
            className="cursor-hover group rounded-2xl border border-slate-300 bg-white p-6 text-center transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-apex-400/50 hover:shadow-md"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-apex-100 text-apex-600 transition-colors duration-300 ease-in-out group-hover:bg-apex-500 group-hover:text-white">
              <Icon size={24} />
            </span>
            <p className="mt-3 text-lg font-semibold text-slate-900">{mood.label}</p>
            <p className="mt-1 text-sm text-slate-500">{mood.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
