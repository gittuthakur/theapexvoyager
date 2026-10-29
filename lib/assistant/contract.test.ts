import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isAssistantRoute } from '@/lib/assistant/routes';

// Source-contract tests: the vitest environment is node-only (no DOM), so what can be asserted about the client
// code is asserted on its source, the same way other tests in this repo guard structural rules.
const root = join(__dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

describe('credentials stay on the server', () => {
  const clientFiles = walk(join(root, 'components', 'modules', 'assistant')).filter((file) => /\.tsx?$/.test(file));

  it('no client file references the API key, the assistant env vars or the OpenAI URL', () => {
    expect(clientFiles.length).toBeGreaterThan(0);
    for (const file of clientFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/OPENAI|process\.env|api\.openai\.com|AI_ASSISTANT/);
    }
  });

  it('the client never imports server-only assistant modules', () => {
    for (const file of clientFiles) {
      const imports = [...readFileSync(file, 'utf8').matchAll(/^import (?!type)[^;]*from '(@\/[^']+)'/gm)].map((m) => m[1]);
      for (const spec of imports) expect(spec, file).not.toMatch(/assistant\/(openai|budget|config|turn|http|prompt)$|models\/|lib\/mongodb|lead\.service/);
    }
  });

  it('no assistant env var is exposed with a NEXT_PUBLIC_ prefix, in code or in .env.example', () => {
    const envExample = read('.env.example');
    expect(envExample).not.toMatch(/NEXT_PUBLIC_(OPENAI|AI_ASSISTANT)/);
    for (const file of walk(join(root, 'lib', 'assistant')).filter((f) => /\.ts$/.test(f) && !f.endsWith('.test.ts'))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/NEXT_PUBLIC_(OPENAI|AI_ASSISTANT)/);
    }
  });

  it('.env.example documents the assistant with commented-out placeholders only, off by default', () => {
    const envExample = read('.env.example');
    for (const name of ['AI_ASSISTANT_MODE', 'OPENAI_API_KEY', 'OPENAI_ASSISTANT_MODEL', 'OPENAI_ASSISTANT_REASONING_EFFORT', 'AI_ASSISTANT_DAILY_REQUEST_LIMIT', 'AI_ASSISTANT_DAILY_TOKEN_LIMIT']) {
      expect(envExample).toMatch(new RegExp(`^# ${name}=`, 'm'));
      expect(envExample).not.toMatch(new RegExp(`^${name}=`, 'm'));
    }
    expect(envExample).toMatch(/^# AI_ASSISTANT_MODE=off/m);
    expect(envExample).toMatch(/^# OPENAI_ASSISTANT_MODEL=gpt-6-luna/m);
    expect(envExample).not.toContain('gpt-5.6');
    expect(envExample).not.toMatch(/sk-[A-Za-z0-9]{8,}/);
  });
});

describe('scope', () => {
  it('uses plain REST fetch and adds no SDK dependency', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
    const all = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(all.filter((name) => /openai|anthropic|^ai$|@ai-sdk/.test(name))).toEqual([]);
  });

  it('reads package data only through the published-only loaders', () => {
    const turn = read('app/api/assistant/route.ts');
    expect(turn).toContain("from '@/lib/packages'");
    expect(turn).not.toMatch(/models\/Journey|Journey\.find/);
    expect(read('lib/packages.ts')).toContain("status: 'published'");
  });

  it('saves enquiries only through the existing lead service', () => {
    const route = read('app/api/assistant/enquiry/route.ts');
    expect(route).toContain("from '@/services/leads/lead.service'");
    expect(route).not.toMatch(/models\/(Lead|Enquiry|Inquiry|BookingRequest)|\.create\(/);
  });

  it('never sends contact details to the model: the enquiry code does not import the model client', () => {
    expect(read('app/api/assistant/enquiry/route.ts')).not.toMatch(/openai|assistant\/turn/);
    expect(read('lib/assistant/enquiry.ts')).not.toMatch(/openai/);
  });

  it('the widget is mounted once, from the root layout', () => {
    expect(read('app/layout.tsx')).toMatch(/<AssistantWidget \/>/);
  });

  it('the launcher sits bottom-left and coordinates with the shared bottom-overlay registry', () => {
    const widget = read('components/modules/assistant/AssistantWidget.tsx');
    expect(widget).toMatch(/fixed left-4/);
    expect(widget).not.toMatch(/fixed [^'"]*right-/);
    expect(widget).toContain("from '@/lib/bottomOverlay'");
    expect(widget).toContain('FloatingOverlay');
  });
});

describe('isAssistantRoute', () => {
  it('shows only on the homepage, the journeys listing and journey pages', () => {
    for (const path of ['/', '/journeys', '/journeys/manali-premium-escape']) expect(isAssistantRoute(path)).toBe(true);
    for (const path of ['/destinations', '/destinations/manali', '/contact', '/journeysx', '/internal/leads', '/bookings', null, undefined]) {
      expect(isAssistantRoute(path)).toBe(false);
    }
  });
});
