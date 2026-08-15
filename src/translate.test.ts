import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translateText } from './translate.js';

function mockMyMemoryResponse(translatedText: string) {
  return new Response(
    JSON.stringify({
      responseStatus: 200,
      responseData: { translatedText },
    }),
  );
}

describe('translateText', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('translates a short text in a single request', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockMyMemoryResponse('Hola, Ada!'));

    await expect(translateText('Hello, Ada!', 'es')).resolves.toBe('Hola, Ada!');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string | URL);
    expect(requestedUrl.searchParams.get('langpair')).toBe('en|es');
  });

  it('splits long text into multiple chunks and joins the translations', async () => {
    const longText = `${'A'.repeat(300)}. ${'B'.repeat(300)}.`;

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(mockMyMemoryResponse('primero'))
      .mockResolvedValueOnce(mockMyMemoryResponse('segundo'));

    await expect(translateText(longText, 'es')).resolves.toBe('primero segundo');
  });

  it('throws when the translation service reports an error status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ responseStatus: 403, responseData: {} })),
    );

    await expect(translateText('Hello', 'es')).rejects.toThrow(
      'Translation service returned no result',
    );
  });

  it('throws when the request itself fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', { status: 500 }),
    );

    await expect(translateText('Hello', 'es')).rejects.toThrow(
      'Translation request failed: 500',
    );
  });
});
