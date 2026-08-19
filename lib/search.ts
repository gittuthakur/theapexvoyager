/**
 * Global Search Service
 * Handles filtering, matching, and ranking of search results
 */

import {
  allSearchResults,
  popularSearches,
  type SearchResult
} from '@/config/search.data';

export interface SearchResultsGrouped {
  destinations: SearchResult[];
  tours: SearchResult[];
  experiences: SearchResult[];
  blog: SearchResult[];
}

/**
 * Normalize text for searching - lowercase and remove extra whitespace
 */
function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if a search term matches any field in a result
 */
function matchesSearchTerm(result: SearchResult, term: string): number {
  const normalizedTerm = normalize(term);
  let score = 0;

  // Title is most important
  if (normalize(result.title).includes(normalizedTerm)) {
    score += 10;
    // Bonus if it starts with the term
    if (normalize(result.title).startsWith(normalizedTerm)) {
      score += 5;
    }
  }

  // Description is second priority
  if (normalize(result.description).includes(normalizedTerm)) {
    score += 5;
  }

  // Category match
  if (result.category && normalize(result.category).includes(normalizedTerm)) {
    score += 3;
  }

  // Location in metadata
  if (result.metadata?.location && normalize(result.metadata.location).includes(normalizedTerm)) {
    score += 3;
  }

  // Keywords array
  if (result.keywords) {
    for (const keyword of result.keywords) {
      if (normalize(keyword).includes(normalizedTerm)) {
        score += 2;
      }
      // Exact keyword match gets higher score
      if (normalize(keyword) === normalizedTerm) {
        score += 3;
      }
    }
  }

  // Tags array
  if (result.tags) {
    for (const tag of result.tags) {
      if (normalize(tag).includes(normalizedTerm)) {
        score += 1;
      }
    }
  }

  return score;
}

/**
 * Search across all results and return grouped by type
 * Results are sorted by relevance score within each category
 */
export function searchGlobal(query: string): SearchResultsGrouped {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      destinations: [],
      tours: [],
      experiences: [],
      blog: []
    };
  }

  const scored = allSearchResults
    .map((result) => ({
      result,
      score: matchesSearchTerm(result, trimmedQuery)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const grouped: SearchResultsGrouped = {
    destinations: [],
    tours: [],
    experiences: [],
    blog: []
  };

  const groupKeyByType: Record<SearchResult['type'], keyof SearchResultsGrouped> = {
    destination: 'destinations',
    tour: 'tours',
    experience: 'experiences',
    blog: 'blog'
  };

  for (const { result } of scored) {
    grouped[groupKeyByType[result.type]].push(result);
  }

  return grouped;
}

/**
 * Get popular search suggestions
 */
export function getPopularSearches(): string[] {
  return popularSearches;
}

/**
 * Check if a query matches a popular search
 */
export function findPopularSearch(query: string): string | null {
  const normalized = normalize(query);
  return popularSearches.find((popular) => normalize(popular).includes(normalized)) || null;
}

/**
 * Get a specific search result by ID
 */
export function getSearchResultById(id: string): SearchResult | undefined {
  return allSearchResults.find((result) => result.id === id);
}

/**
 * Get all results for a specific type
 */
export function getResultsByType(type: SearchResult['type']): SearchResult[] {
  return allSearchResults.filter((result) => result.type === type);
}

/**
 * Format price for display
 */
export function formatPrice(price?: string): string {
  return price || 'Contact for price';
}

/**
 * Format duration for display
 */
export function formatDuration(duration?: string): string {
  return duration || 'Duration varies';
}
