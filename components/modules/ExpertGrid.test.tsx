import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { TravelExpert } from '@/types/expert';

vi.mock('@/components/modules/TalkToTravelTeamButton', () => ({ default: () => <button type="button">Talk to Our Travel Team</button> }));
vi.mock('@/components/modules/ExpertCard', () => ({ default: ({ expert }: { expert: TravelExpert }) => <article>{expert.name}</article> }));

const { default: ExpertGrid } = await import('./ExpertGrid');

const anita: TravelExpert = {
  slug: 'anita-rao', name: 'Anita Rao', role: 'Planner', profileImage: '/x.jpg', bio: 'b', destinationSlugs: [], travelStyles: [], expertise: [], active: true, publiclyListed: true
};

describe('ExpertGrid empty states', () => {
  it('an empty public catalog is stated honestly and offers the Travel Team action — never "no match for your filters"', () => {
    const html = renderToStaticMarkup(<ExpertGrid experts={[]} catalogEmpty />);
    expect(html).toContain('specialist profiles aren&#x27;t available online yet');
    expect(html).toContain('Talk to Our Travel Team');
    expect(html).not.toContain('for these filters');
  });
  it('no match within a non-empty catalog still reads as a filter result, with the same action', () => {
    const html = renderToStaticMarkup(<ExpertGrid experts={[]} catalogEmpty={false} />);
    expect(html).toContain('for these filters');
    expect(html).toContain('Talk to Our Travel Team');
  });
  it('lists experts when there are some, with no placeholder cards invented', () => {
    const html = renderToStaticMarkup(<ExpertGrid experts={[anita]} />);
    expect(html).toContain('Anita Rao');
    expect((html.match(/<article>/g) ?? []).length).toBe(1);
    expect(html).not.toContain('Talk to Our Travel Team');
  });
});
