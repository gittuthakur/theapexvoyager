import { JOURNEY_PRICE_DISCLAIMER } from '@/lib/journeyPriceDisplay';
import { buildCard, type AssistantCard } from '@/lib/assistant/cards';
import { isAssistantReady, type AssistantConfig } from '@/lib/assistant/config';
import { SAFE_ASK_FALLBACK, sanitizeReply } from '@/lib/assistant/guard';
import { parseModelOutput, type ChatMessage, type SearchCriteria } from '@/lib/assistant/schema';
import { searchJourneys } from '@/lib/assistant/search';
import type { BudgetResult } from '@/lib/assistant/budget';
import type { ModelCallResult } from '@/lib/assistant/openai';
import type { TravelPackage } from '@/types/package';

export interface AssistantPrefill {
  destination?: string;
  travellers?: number;
  month?: string;
  budget?: string;
  nights?: string;
}

export interface AssistantReplyBody {
  reply: string;
  cards: AssistantCard[];
  /** Shown only when at least one card carries a price. */
  priceDisclaimer?: string;
  /** True when the visitor should be offered the enquiry form. */
  showEnquiry: boolean;
  prefill: AssistantPrefill;
}

export type TurnResult =
  | { status: 200; body: AssistantReplyBody }
  | { status: 429 | 502 | 503; code: 'ASSISTANT_UNAVAILABLE' | 'ASSISTANT_BUSY' | 'ASSISTANT_ERROR' | 'SEARCH_UNAVAILABLE'; message: string };

export interface TurnDeps {
  config: AssistantConfig;
  reserve: (config: AssistantConfig) => Promise<BudgetResult>;
  record: (tokens: number) => Promise<void>;
  callModel: (config: AssistantConfig, messages: readonly ChatMessage[]) => Promise<ModelCallResult>;
  getPackages: () => Promise<TravelPackage[]>;
}

const SEARCH_FOUND =
  'These published journeys look like a good fit. The prices shown are indicative starting prices; travel dates, availability and hotels need confirmation from our team.';
const SEARCH_EMPTY =
  'I could not find a published journey that matches that. Our team can look at a custom plan for you: you can send an enquiry below.';
const ENQUIRY_LEAD = 'Happy to pass this to our team. Please share your details below and they will get back to you. This is an enquiry, not a booking.';
const MODEL_FALLBACK = `${SAFE_ASK_FALLBACK} If you would rather talk to our team, you can send an enquiry below.`;

function toPrefill(criteria: SearchCriteria): AssistantPrefill {
  const nights =
    criteria.nightsMin !== undefined && criteria.nightsMax !== undefined && criteria.nightsMin !== criteria.nightsMax
      ? `${criteria.nightsMin}-${criteria.nightsMax} nights`
      : criteria.nightsMin !== undefined || criteria.nightsMax !== undefined
        ? `${criteria.nightsMin ?? criteria.nightsMax} nights`
        : undefined;
  return {
    destination: criteria.destination,
    travellers: criteria.travellers,
    month: criteria.month,
    budget: criteria.budgetPerPerson !== undefined ? `Up to ${criteria.budgetPerPerson} per person` : undefined,
    nights
  };
}

/**
 * One assistant turn. Order matters and every step fails closed:
 *   ready? -> reserve shared budget -> model call -> validate output -> (search published journeys) -> compose.
 * The model decides only what to ask and which search criteria were stated. Which packages appear, their links,
 * prices and inclusions are built here from verified database fields, and the wording around search results is
 * fixed server-side so it can never disagree with them.
 */
export async function runAssistantTurn(messages: readonly ChatMessage[], deps: TurnDeps): Promise<TurnResult> {
  const { config } = deps;
  if (!isAssistantReady(config)) return { status: 503, code: 'ASSISTANT_UNAVAILABLE', message: 'The assistant is not available right now.' };

  const budget = await deps.reserve(config);
  if (!budget.ok) return { status: 503, code: 'ASSISTANT_BUSY', message: 'The assistant is busy right now. Please send an enquiry and our team will help.' };

  const model = await deps.callModel(config, messages);
  if (model.ok) await deps.record(model.tokens);
  if (!model.ok) return { status: 502, code: 'ASSISTANT_ERROR', message: 'The assistant could not answer right now.' };

  const output = parseModelOutput(model.content);
  if (!output) return { status: 200, body: { reply: MODEL_FALLBACK, cards: [], showEnquiry: true, prefill: {} } };

  const prefill = toPrefill(output.criteria);

  if (output.intent === 'enquiry') return { status: 200, body: { reply: ENQUIRY_LEAD, cards: [], showEnquiry: true, prefill } };

  if (output.intent === 'ask') {
    return { status: 200, body: { reply: sanitizeReply(output.reply), cards: [], showEnquiry: false, prefill } };
  }

  let packages: TravelPackage[];
  try {
    packages = await deps.getPackages();
  } catch {
    return { status: 503, code: 'SEARCH_UNAVAILABLE', message: 'Search is temporarily unavailable. Please send an enquiry and our team will help.' };
  }
  const cards = searchJourneys(packages, output.criteria).map(buildCard);
  if (cards.length === 0) return { status: 200, body: { reply: SEARCH_EMPTY, cards: [], showEnquiry: true, prefill } };
  return {
    status: 200,
    body: {
      reply: SEARCH_FOUND,
      cards,
      priceDisclaimer: cards.some((card) => card.priceLabel) ? JOURNEY_PRICE_DISCLAIMER : undefined,
      // Availability and hotels are never verified here, so a human confirmation is always offered alongside results.
      showEnquiry: true,
      prefill
    }
  };
}
