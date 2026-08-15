export interface NameOrigin {
  title: string;
  extract: string;
  url: string;
}

const WIKI_API = 'https://en.wikipedia.org/w/api.php';

interface SearchResponse {
  query?: { search?: Array<{ title: string }> };
}

interface ExtractResponse {
  query?: {
    pages?: Record<string, { extract?: string; fullurl?: string }>;
  };
}

async function wikiSearch(name: string): Promise<string | null> {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('list', 'search');
  url.searchParams.set('srsearch', `${name} given name`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Wikipedia search failed: ${res.status}`);
  }
  const data = (await res.json()) as SearchResponse;
  return data.query?.search?.[0]?.title ?? null;
}

async function wikiExtract(
  title: string,
): Promise<{ extract: string; url: string } | null> {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('prop', 'extracts|info');
  url.searchParams.set('exintro', '1');
  url.searchParams.set('explaintext', '1');
  url.searchParams.set('inprop', 'url');
  url.searchParams.set('titles', title);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Wikipedia extract failed: ${res.status}`);
  }
  const data = (await res.json()) as ExtractResponse;
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page?.extract) {
    return null;
  }
  return { extract: page.extract, url: page.fullurl ?? '' };
}

export async function getNameOrigin(name: string): Promise<NameOrigin | null> {
  const title = await wikiSearch(name);
  if (!title) {
    return null;
  }
  const details = await wikiExtract(title);
  if (!details) {
    return null;
  }
  return { title, extract: details.extract, url: details.url };
}
