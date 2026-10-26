'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Send, Sparkles, X } from 'lucide-react';
import { FloatingOverlay } from '@/components/ui/FloatingOverlay';
import AssistantEnquiryForm, { type EnquiryPrefill } from '@/components/modules/assistant/AssistantEnquiryForm';
import { isAssistantRoute } from '@/lib/assistant/routes';
import { hasBottomOverlay, subscribeBottomOverlay } from '@/lib/bottomOverlay';
import { cn } from '@/lib/utils';
import type { AssistantCard } from '@/lib/assistant/cards';
import type { AssistantReplyBody } from '@/lib/assistant/turn';

const MAX_USER_CHARS = 500;
const MAX_USER_TURNS = 6;
const GREETING =
  'Hi! I can help you find a journey from our published packages. Where would you like to go, and roughly when? Please keep phone numbers and emails out of the chat: if you want our team to contact you, use the enquiry form.';

interface UiMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  cards?: AssistantCard[];
  priceDisclaimer?: string;
  /** The static greeting and local error notes are never sent back to the server. */
  local?: boolean;
}

// Shared across navigations so the status check runs once per page load, not once per route.
let enabledCache: boolean | null = null;

const getServerOverlaySnapshot = () => false;

export default function AssistantWidget() {
  const pathname = usePathname();
  const eligible = isAssistantRoute(pathname);
  const [enabled, setEnabled] = useState<boolean | null>(enabledCache);
  const [open, setOpen] = useState(false);
  const [nearFooter, setNearFooter] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([{ id: 0, role: 'assistant', content: GREETING, local: true }]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [enquiry, setEnquiry] = useState<EnquiryPrefill | null>(null);
  const [lastPrefill, setLastPrefill] = useState<EnquiryPrefill>({});
  const [showEnquiryCta, setShowEnquiryCta] = useState(false);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayActive = useSyncExternalStore(subscribeBottomOverlay, hasBottomOverlay, getServerOverlaySnapshot);

  // Ask the server once whether the assistant is switched on. Anything but an explicit `enabled: true` keeps it hidden.
  useEffect(() => {
    if (!eligible || enabledCache !== null) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/assistant', { cache: 'no-store' });
        const data = (await response.json()) as { enabled?: unknown };
        enabledCache = response.ok && data.enabled === true;
      } catch {
        enabledCache = false;
      }
      if (!cancelled) setEnabled(enabledCache);
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [eligible]);

  // Same courtesy as the floating WhatsApp button: step aside before the footer comes into view.
  useEffect(() => {
    if (!eligible || !enabled) return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setNearFooter(entry.isIntersecting), { rootMargin: '0px 0px 400px 0px' });
    observer.observe(footer);
    return () => observer.disconnect();
  }, [eligible, enabled, pathname]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading, enquiry]);

  const close = useCallback(() => setOpen(false), []);
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const limitReached = userTurns >= MAX_USER_TURNS;

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || loading || limitReached) return;

    const userMessage: UiMessage = { id: nextId.current++, role: 'user', content: text };
    const history = [...messages, userMessage];
    setMessages(history);
    setDraft('');
    setLoading(true);
    setShowEnquiryCta(false);

    const assistantNote = (content: string, extra: Partial<UiMessage> = {}): UiMessage => ({ id: nextId.current++, role: 'assistant', content, ...extra });
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.filter((m) => !m.local).map(({ role, content }) => ({ role, content })) })
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setMessages((current) => [...current, assistantNote(data?.error?.message ?? 'The assistant could not answer right now.', { local: true })]);
        setShowEnquiryCta(true);
        return;
      }
      const data = (await response.json()) as AssistantReplyBody;
      setMessages((current) => [...current, assistantNote(data.reply, { cards: data.cards, priceDisclaimer: data.priceDisclaimer })]);
      setLastPrefill({ ...data.prefill, travellers: data.prefill.travellers });
      setShowEnquiryCta(data.showEnquiry);
    } catch {
      setMessages((current) => [...current, assistantNote('Something went wrong. Please try again, or send an enquiry.', { local: true })]);
      setShowEnquiryCta(true);
    } finally {
      setLoading(false);
    }
  }

  if (!eligible || !enabled) return null;

  const hidden = nearFooter && !open;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open trip assistant"
        aria-haspopup="dialog"
        tabIndex={hidden ? -1 : 0}
        aria-hidden={hidden || undefined}
        style={{ bottom: overlayActive ? 'calc(env(safe-area-inset-bottom) + 6.5rem)' : 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
        className={cn(
          'cursor-hover fixed left-4 z-40 inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-apex-500 font-semibold text-white shadow-2xl shadow-apex-500/20 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-apex-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apex-300 sm:left-6 sm:h-auto sm:w-auto sm:px-5 sm:py-4 print:hidden',
          hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
        )}
      >
        <Sparkles size={22} aria-hidden="true" />
        <span className="hidden sm:inline">Plan with AI</span>
      </button>

      <FloatingOverlay
        open={open}
        onClose={close}
        label="Trip assistant"
        overlayClassName="items-end justify-start bg-slate-950/40 p-0 sm:p-6"
        panelClassName="my-0 flex h-[min(38rem,100dvh)] max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[min(38rem,calc(100dvh-3rem))] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Trip assistant</p>
            <p className="text-xs text-slate-500">AI-generated help. Our team confirms prices, dates and availability.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close trip assistant" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {enquiry ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AssistantEnquiryForm prefill={enquiry} onDone={() => setEnquiry(null)} />
          </div>
        ) : (
          <>
            <div ref={listRef} role="log" aria-live="polite" aria-label="Conversation" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((message) => (
                <div key={message.id} className={cn('flex flex-col gap-2', message.role === 'user' ? 'items-end' : 'items-start')}>
                  <p
                    className={cn(
                      'max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm',
                      message.role === 'user' ? 'bg-apex-500 text-white' : 'bg-slate-100 text-slate-800'
                    )}
                  >
                    {message.content}
                  </p>
                  {message.cards?.map((card) => (
                    <article key={card.slug} className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      {card.image ? (
                        <div className="relative h-28 w-full bg-slate-100">
                          <Image src={card.image} alt="" fill sizes="(min-width: 640px) 28rem, 100vw" className="object-cover" />
                        </div>
                      ) : null}
                      <div className="space-y-1.5 p-3">
                        <h3 className="text-sm font-semibold text-slate-900">{card.name}</h3>
                        <p className="text-xs text-slate-500">
                          {card.destination} · {card.duration}
                        </p>
                        {card.priceLabel ? <p className="text-sm font-semibold text-slate-900">{card.priceLabel}</p> : null}
                        {card.inclusions ? (
                          <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-600">
                            {card.inclusions.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <Link href={card.url} onClick={close} className="text-sm font-semibold text-apex-600 hover:underline">
                            View journey
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEnquiry({ ...lastPrefill, destination: card.destination, journeySlug: card.slug, journeyName: card.name })}
                            className="text-sm font-medium text-slate-600 hover:underline"
                          >
                            Enquire about this
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {message.priceDisclaimer ? <p className="text-[11px] leading-snug text-slate-500">{message.priceDisclaimer}</p> : null}
                </div>
              ))}
              {loading ? (
                <p className="text-xs text-slate-500" role="status">
                  Thinking...
                </p>
              ) : null}
            </div>

            <div className="border-t border-slate-200 bg-white px-4 py-3">
              {showEnquiryCta || limitReached ? (
                <button
                  type="button"
                  onClick={() => setEnquiry(lastPrefill)}
                  className="mb-2 w-full rounded-full border border-apex-500 px-4 py-2 text-sm font-semibold text-apex-600 hover:bg-apex-50"
                >
                  Send an enquiry to our team
                </button>
              ) : null}
              {limitReached ? (
                <p className="text-xs text-slate-500">This chat has reached its length limit. Please send an enquiry and our team will take it from here.</p>
              ) : (
                <form onSubmit={send} className="flex items-end gap-2">
                  <label htmlFor="assistant-input" className="sr-only">
                    Your message
                  </label>
                  <textarea
                    id="assistant-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, MAX_USER_CHARS))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={2}
                    maxLength={MAX_USER_CHARS}
                    placeholder="e.g. 5 nights in Kashmir in May"
                    className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-apex-500 focus:outline-none focus:ring-2 focus:ring-apex-500/30"
                  />
                  <button
                    type="submit"
                    disabled={loading || !draft.trim()}
                    aria-label="Send message"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-apex-500 text-white hover:bg-apex-600 disabled:opacity-50"
                  >
                    <Send size={18} aria-hidden="true" />
                  </button>
                </form>
              )}
              {!limitReached ? (
                <button type="button" onClick={() => setEnquiry(lastPrefill)} className="mt-2 text-xs font-medium text-slate-500 hover:underline">
                  Prefer to talk to our team? Send an enquiry
                </button>
              ) : null}
            </div>
          </>
        )}
      </FloatingOverlay>
    </>
  );
}
