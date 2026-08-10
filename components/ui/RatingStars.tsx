import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: number;
  className?: string;
}

export function RatingStars({ rating, max = 5, size = 16, className }: RatingStarsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="img" aria-label={`Rated ${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          size={size}
          className={index < rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-600'}
        />
      ))}
    </div>
  );
}
