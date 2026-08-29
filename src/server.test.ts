import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('./nameOrigin.js', () => ({
  getNameOrigin: vi.fn(async (name: string) =>
    name === 'Ada'
      ? {
          title: 'Ada (given name)',
          extract: 'Ada is a name.',
          url: 'https://en.wikipedia.org/wiki/Ada',
        }
      : null,
  ),
}));

vi.mock('./translate.js', () => ({
  translateText: vi.fn(async (text: string, targetLang: string) =>
    targetLang === 'es' ? `[es] ${text}` : Promise.reject(new Error('unsupported language')),
  ),
}));

import { server } from './server.js';

let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://localhost:${port}`;
});

afterAll(() => {
  server.close();
});

describe('server', () => {
  it('serves the static index page', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Name Origin Finder');
  });

  it('returns a name origin from the API', async () => {
    const res = await fetch(`${baseUrl}/api/origin?name=Ada`);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      title: 'Ada (given name)',
      extract: 'Ada is a name.',
      url: 'https://en.wikipedia.org/wiki/Ada',
    });
  });

  it('returns null when no origin is found', async () => {
    const res = await fetch(`${baseUrl}/api/origin?name=Xyzzyxx`);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toBeNull();
  });

  it('returns 400 when the name parameter is missing', async () => {
    const res = await fetch(`${baseUrl}/api/origin`);
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown static paths', async () => {
    const res = await fetch(`${baseUrl}/does-not-exist`);
    expect(res.status).toBe(404);
  });

  it('serves the world map page', async () => {
    const res = await fetch(`${baseUrl}/map.html`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Interactive World Map');
  });

  it('serves country borders as geo+json', async () => {
    const res = await fetch(`${baseUrl}/data/countries.geojson`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/geo+json');
    const geojson = (await res.json()) as { type: string; features: unknown[] };
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features.length).toBeGreaterThan(0);
  });

  it('serves capital cities as geo+json', async () => {
    const res = await fetch(`${baseUrl}/data/capitals.geojson`);
    expect(res.status).toBe(200);
    const geojson = (await res.json()) as { type: string; features: unknown[] };
    expect(geojson.type).toBe('FeatureCollection');
    expect(geojson.features.length).toBeGreaterThan(0);
  });

  it('translates text via the API', async () => {
    const res = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Ada is a name.', targetLang: 'es' }),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      translatedText: '[es] Ada is a name.',
    });
  });

  it('returns 400 when translate is missing text or targetLang', async () => {
    const res = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Ada is a name.' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 502 when the translation service fails', async () => {
    const res = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Ada is a name.', targetLang: 'xx' }),
    });
    expect(res.status).toBe(502);
  });

  it('returns 400 for malformed JSON on translate', async () => {
    const res = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    });
    expect(res.status).toBe(400);
  });
});
