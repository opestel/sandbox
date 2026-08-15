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
});
