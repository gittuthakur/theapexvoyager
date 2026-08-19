export interface StayHeroProps {
  eyebrow?: string;
  title?: string;
  hilight?: string;
  subtitle?: string;
}

export default function StayHero({
  eyebrow = 'Apex Stays',
  title = 'Stay Somewhere ',
  hilight = 'Worth Remembering',
  subtitle = 'From mountain-view hotels to hidden homestays, discover stays that make your Himalayan journey unforgettable.'
}: StayHeroProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-semibold uppercase tracking-[0.16em] text-apex-600">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">{title}<span className="bg-gradient-to-r from-apex-500 via-apex-600 to-apex-700 bg-clip-text text-transparent">{hilight}</span></h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">{subtitle}</p>
    </div>
  );
}
