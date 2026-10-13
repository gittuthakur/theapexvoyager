'use client';

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import { GlobalSearchResults, buildNavItems, describeView, optionId } from '@/components/modules/globalSearch/GlobalSearchResults';
import { GLOBAL_SEARCH_CLIENT, createBrowserGlobalSearchController, type GlobalSearchView } from '@/lib/globalSearchClient';

export interface GlobalSearchProps {
  open: boolean;
  /** Called on close — the caller is responsible for returning focus to whichever trigger opened it. */
  onClose: () => void;
}

const IDLE_VIEW: GlobalSearchView = { phase: 'idle' };

/**
 * Header Global Search. Results come from the server (GET /api/search) - the published, eligible catalogs - through the
 * controller in lib/globalSearchClient.ts, which owns debouncing, aborting, stale-response rejection and error
 * handling. This component only renders the controller's view and handles input/keyboard.
 */
export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  // The highlight belongs to ONE view: a new result list never inherits it (derived below, no effect needed).
  const [active, setActive] = useState<{ view: GlobalSearchView; key?: string }>({ view: IDLE_VIEW });
  const [wasOpen, setWasOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `global-search-${useId().replace(/:/g, '')}`;

  const controller = useMemo(() => createBrowserGlobalSearchController(), []);
  const view = useSyncExternalStore(controller.subscribe, controller.getView, () => IDLE_VIEW);
  const activeKey = active.view === view ? active.key : undefined;
  const setActiveKey = (key: string | undefined) => setActive({ view, key });

  // Closing forgets the text: each opening is a fresh search (adjusting state during render, per React's guidance).
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setQuery('');
  }

  // Search only while open: closing aborts the pending request and forgets the session; reopening starts empty.
  useEffect(() => {
    if (open) controller.setQuery(query);
    else controller.close();
  }, [open, query, controller]);
  useEffect(() => () => controller.close(), [controller]);

  // Autofocus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const navItems = useMemo(() => buildNavItems(view), [view]);

  // Keep the highlighted row visible inside the scrolling results panel.
  useEffect(() => {
    if (!activeKey) return;
    document.getElementById(optionId(listboxId, activeKey))?.scrollIntoView({ block: 'nearest' });
  }, [activeKey, listboxId]);

  function go(href: string) {
    router.push(href);
    onClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const index = activeKey ? navItems.findIndex((item) => item.key === activeKey) : -1;
    switch (event.key) {
      case 'ArrowDown':
        if (navItems.length === 0) return;
        event.preventDefault();
        setActiveKey(navItems[Math.min(index + 1, navItems.length - 1)].key);
        break;
      case 'ArrowUp':
        if (navItems.length === 0) return;
        event.preventDefault();
        setActiveKey(index <= 0 ? undefined : navItems[index - 1].key);
        break;
      case 'Enter': {
        event.preventDefault();
        // The highlighted row, otherwise the first real RESULT (never a "See all" link, never anything while loading).
        const target = index >= 0 ? navItems[index] : navItems.find((item) => item.kind === 'result');
        if (target) go(target.href);
        break;
      }
      default:
        break;
    }
  }

  const pending = view.phase === 'loading';
  const hasList = navItems.length > 0;

  return (
    <FloatingOverlay open={open} onClose={onClose} label="Global search" overlayClassName="bg-slate-950/40" panelClassName="max-w-2xl">
      {/* Search Input Container */}
      <div className="relative mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
        <Search className="shrink-0 text-slate-500" size={20} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={hasList}
          aria-controls={hasList ? listboxId : undefined}
          aria-activedescendant={activeKey && hasList ? optionId(listboxId, activeKey) : undefined}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          placeholder="Search destinations, journeys, experiences..."
          value={query}
          maxLength={GLOBAL_SEARCH_CLIENT.maxQueryLength}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-500"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-label="Search"
        />
        {pending ? <Loader2 className="shrink-0 animate-spin text-apex-500" size={18} aria-hidden="true" /> : null}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
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

      {/* Spoken status: loading, count, partial, errors. */}
      <div role="status" aria-live="polite" className="sr-only">
        {describeView(view)}
      </div>

      {/* Results Container — capped height with its own scroll region (see the previous implementation's note on wheel/touch). */}
      <div
        aria-busy={pending}
        className="pointer-events-auto max-h-[350px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <GlobalSearchResults
          view={view}
          listboxId={listboxId}
          activeKey={activeKey}
          onHover={setActiveKey}
          onNavigate={onClose}
          onRetry={() => controller.retry()}
          onPopular={(text) => {
            setQuery(text);
            inputRef.current?.focus();
          }}
        />
      </div>
    </FloatingOverlay>
  );
}
