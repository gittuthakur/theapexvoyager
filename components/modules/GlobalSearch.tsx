'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, Star, X } from 'lucide-react';
import { searchGlobal, getPopularSearches, type SearchResultsGrouped } from '@/lib/search';
import type { SearchResult } from '@/config/search.data';
import { cn } from '@/lib/utils';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { SafeImage } from '@/components/ui/SafeImage';

export interface GlobalSearchProps {
  open: boolean;
  /** Called on close — the caller is responsible for returning focus to whichever trigger opened it. */
  onClose: () => void;
}

type ActiveItem = { kind: 'result'; result: SearchResult } | { kind: 'popular'; text: string };

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultsGrouped>({
    destinations: [],
    tours: [],
    experiences: [],
    blog: []
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the overlay is rendered
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Handle search as user types
  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchGlobal(query);
      setResults(searchResults);
      setSelectedIndex(-1);
    } else {
      setResults({
        destinations: [],
        tours: [],
        experiences: [],
        blog: []
      });
      setSelectedIndex(-1);
    }
  }, [query]);

  // Check if any results exist
  const hasResults =
    results.destinations.length > 0 ||
    results.tours.length > 0 ||
    results.experiences.length > 0 ||
    results.blog.length > 0;

  const allPopular = getPopularSearches();

  // Flat, ordered view of whatever is currently interactive — keyboard
  // navigation, highlighting, and Enter-to-select all read from this single list
  // instead of re-deriving bounds/order in three different places.
  const activeItems: ActiveItem[] = useMemo(() => {
    if (query.trim() && hasResults) {
      return [
        ...results.destinations,
        ...results.tours,
        ...results.experiences,
        ...results.blog
      ].map((result): ActiveItem => ({ kind: 'result', result }));
    }
    return allPopular.map((text): ActiveItem => ({ kind: 'popular', text }));
  }, [query, results, hasResults, allPopular]);

  const selectedItem = selectedIndex >= 0 ? activeItems[selectedIndex] : undefined;

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < activeItems.length - 1 ? prev + 1 : prev));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < activeItems.length) {
            navigateToItem(activeItems[selectedIndex]);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, activeItems, onClose]);

  // Navigate to (or apply) the given item
  function navigateToItem(item: ActiveItem) {
    if (item.kind === 'result') {
      router.push(item.result.href);
      onClose();
    } else {
      setQuery(item.text);
    }
  }

  // Handle popular search click
  function handlePopularSearchClick(search: string) {
    setQuery(search);
    inputRef.current?.focus();
  }

  // Handle clear search
  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
  }

  return (
    <FloatingOverlay
      open={open}
      onClose={onClose}
      label="Global search"
      overlayClassName="bg-slate-950/40"
      panelClassName="max-w-2xl"
    >
              {/* Search Input Container */}
              <div className="relative mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
                <Search className="shrink-0 text-slate-500" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search destinations, tours, experiences..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-500"
                  autoComplete="off"
                  aria-label="Search"
                />
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="cursor-hover shrink-0 rounded-full p-1 text-slate-500 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-hover shrink-0 rounded-full p-1 text-slate-500 transition-all duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close search"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results Container — capped height with its own scroll region so long
                  result lists never blow up the panel (and double-scroll against the
                  overlay); the native scrollbar is hidden but scrolling stays active.
                  Wheel/touch events stop here so overscrolling this list can't bubble
                  up into the overlay's own scroll container or the page behind it. */}
              <div
                className="pointer-events-auto max-h-[350px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {/* Show Results or Empty State */}
                {query.trim() && !hasResults ? (
                  <div className="space-y-6 px-6 py-12 text-center">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">No results found</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        We couldn't find anything matching "<span className="font-medium">{query}</span>". Try another destination, tour or experience.
                      </p>
                    </div>

                    {/* Popular Searches in No Results State */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Popular Searches
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {allPopular.map((popular, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handlePopularSearchClick(popular)}
                            aria-selected={Boolean(selectedItem?.kind === 'popular' && selectedItem.text === popular)}
                            className={cn(
                              'cursor-hover rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out',
                              selectedItem?.kind === 'popular' && selectedItem.text === popular
                                ? 'border-apex-400/50 bg-apex-50 text-apex-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700'
                            )}
                          >
                            {popular}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : query.trim() ? (
                  // Show categorized results
                  <div className="space-y-6 px-6 py-6">
                    {/* Destinations */}
                    {results.destinations.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Destinations
                        </p>
                        <div className="space-y-2">
                          {results.destinations.map((result, index) => (
                            <SearchResultItem
                              key={`${result.id}-${index}`}
                              result={result}
                              onClose={onClose}
                              isSelected={selectedItem?.kind === 'result' && selectedItem.result.id === result.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tours */}
                    {results.tours.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Tours
                        </p>
                        <div className="space-y-2">
                          {results.tours.map((result) => (
                            <SearchResultItem
                              key={result.id}
                              result={result}
                              onClose={onClose}
                              isSelected={selectedItem?.kind === 'result' && selectedItem.result.id === result.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experiences */}
                    {results.experiences.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Experiences
                        </p>
                        <div className="space-y-2">
                          {results.experiences.map((result) => (
                            <SearchResultItem
                              key={result.id}
                              result={result}
                              onClose={onClose}
                              isSelected={selectedItem?.kind === 'result' && selectedItem.result.id === result.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blog */}
                    {results.blog.length > 0 && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Travel Guides
                        </p>
                        <div className="space-y-2">
                          {results.blog.map((result) => (
                            <SearchResultItem
                              key={result.id}
                              result={result}
                              onClose={onClose}
                              isSelected={selectedItem?.kind === 'result' && selectedItem.result.id === result.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show popular searches when empty
                  <div className="space-y-6 px-6 py-8">
                    <div>
                      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Popular Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allPopular.map((popular, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handlePopularSearchClick(popular)}
                            aria-selected={Boolean(selectedItem?.kind === 'popular' && selectedItem.text === popular)}
                            className={cn(
                              'cursor-hover rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ease-in-out',
                              selectedItem?.kind === 'popular' && selectedItem.text === popular
                                ? 'border-apex-400/50 bg-apex-50 text-apex-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-apex-400/50 hover:bg-apex-50 hover:text-apex-700'
                            )}
                          >
                            {popular}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">💡 Tip:</span> Try searching for destinations, tours, activities, or travel guides.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Help Text */}
              {/* <div className="mt-4 flex items-center justify-between gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-200 p-2">↑↓</span>
                  <span>Navigate</span>
                  <span className="rounded bg-slate-200 px-2 py-1">↵</span>
                  <span>Select</span>
                  <span className="rounded bg-slate-200 px-2 py-1">esc</span>
                  <span>Close</span>
                </div>
              </div> */}
    </FloatingOverlay>
  );
}

/**
 * Individual search result item
 */
interface SearchResultItemProps {
  result: {
    id: string;
    type: 'destination' | 'tour' | 'experience' | 'blog';
    title: string;
    description: string;
    image?: string;
    href: string;
    category?: string;
    metadata?: {
      price?: string;
      duration?: string;
      rating?: number;
      reviewCount?: number;
      location?: string;
    };
  };
  onClose: () => void;
  isSelected?: boolean;
}

function SearchResultItem({ result, onClose, isSelected }: SearchResultItemProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    onClose();
  };

  return (
    <Link
      href={result.href}
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        'group flex items-start gap-4 rounded-lg border px-4 py-3 transition',
        isHovering || isSelected
          ? 'border-apex-400/50 bg-apex-50'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      {/* Thumbnail, falling back to a type badge when no image is available */}
      <div className="mt-0.5 shrink-0">
        {result.image ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
            <SafeImage src={result.image} alt="" fill sizes="40px" className="object-cover" />
          </div>
        ) : (
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold',
            result.type === 'destination' && 'bg-blue-50 text-blue-600',
            result.type === 'tour' && 'bg-purple-50 text-purple-600',
            result.type === 'experience' && 'bg-amber-50 text-amber-600',
            result.type === 'blog' && 'bg-cyan-50 text-cyan-600'
          )}>
            {result.type === 'destination' && '📍'}
            {result.type === 'tour' && '🏔️'}
            {result.type === 'experience' && '✨'}
            {result.type === 'blog' && '📖'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-slate-900">{result.title}</h4>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{result.description}</p>

            {/* Metadata */}
            {result.metadata && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {result.metadata.location && (
                  <span>{result.metadata.location}</span>
                )}
                {result.metadata.duration && (
                  <span>•</span>
                )}
                {result.metadata.duration && (
                  <span>{result.metadata.duration}</span>
                )}
                {result.metadata.price && (
                  <span>•</span>
                )}
                {result.metadata.price && (
                  <span className="font-medium text-apex-300">{result.metadata.price}</span>
                )}
                {result.metadata.rating && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {result.metadata.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Arrow Icon */}
          <div className="mt-1 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-slate-900">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}
