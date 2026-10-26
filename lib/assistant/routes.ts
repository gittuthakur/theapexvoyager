/** Only the homepage, the journeys listing and journey detail pages carry the assistant. */
export function isAssistantRoute(pathname: string | null | undefined): boolean {
  return pathname === '/' || pathname === '/journeys' || Boolean(pathname?.startsWith('/journeys/'));
}
