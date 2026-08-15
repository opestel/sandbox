const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

// MyMemory's anonymous tier caps requests at ~500 bytes of query text;
// stay well under that so multi-byte (non-Latin) text doesn't overflow it.
const MAX_CHUNK_LENGTH = 400;

interface MyMemoryResponse {
  responseStatus: number | string;
  responseData?: { translatedText?: string };
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current && (current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }
  return chunks;
}

async function translateChunk(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<string> {
  const url = new URL(MYMEMORY_API);
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', `${sourceLang}|${targetLang}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Translation request failed: ${res.status}`);
  }
  const data = (await res.json()) as MyMemoryResponse;
  const translatedText = data.responseData?.translatedText;
  if (Number(data.responseStatus) !== 200 || !translatedText) {
    throw new Error('Translation service returned no result');
  }
  return translatedText;
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = 'en',
): Promise<string> {
  const chunks = splitIntoChunks(text, MAX_CHUNK_LENGTH);
  const translated: string[] = [];
  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk, targetLang, sourceLang));
  }
  return translated.join(' ');
}
