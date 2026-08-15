import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getNameOrigin } from './nameOrigin.js';

describe('getNameOrigin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the title, extract, and url for a found name', async () => {
    const searchResponse = {
      query: { search: [{ title: 'Ada (given name)' }] },
    };
    const extractResponse = {
      query: {
        pages: {
          '123': {
            extract: 'Ada is a feminine given name of German origin.',
            fullurl: 'https://en.wikipedia.org/wiki/Ada_(given_name)',
          },
        },
      },
    };

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(searchResponse)))
      .mockResolvedValueOnce(new Response(JSON.stringify(extractResponse)));

    await expect(getNameOrigin('Ada')).resolves.toEqual({
      title: 'Ada (given name)',
      extract: 'Ada is a feminine given name of German origin.',
      url: 'https://en.wikipedia.org/wiki/Ada_(given_name)',
    });
  });

  it('returns null when the search has no results', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ query: { search: [] } })),
    );

    await expect(getNameOrigin('Xyzzyxx')).resolves.toBeNull();
  });

  it('throws when the search request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 500 }),
    );

    await expect(getNameOrigin('Ada')).rejects.toThrow(
      'Wikipedia search failed: 500',
    );
  });
});
