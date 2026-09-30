import { requireAuth } from '@/lib/dal';
import { ROLES } from '@/lib/roles';

interface AiSearchResponse {
  answer?: unknown;
  matches?: unknown;
  no_match_reason?: unknown;
  roster_size?: unknown;
}

// POST /api/hr/talent-search - proxy pencarian talent ke AMANA AI.
// API key hanya dibaca di server (header X-API-Key) sehingga tidak pernah sampai ke browser.
// Body: { query: string } -> { answer, matches, noMatchReason, rosterSize }
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth.idRole !== ROLES.ADMIN_HR) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const query = String(body?.query ?? '').trim();
    if (query.length < 3) {
      return Response.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }

    const baseUrl = process.env.AMANA_AI_URL;
    const apiKey = process.env.AMANA_AI_API_KEY;
    if (!baseUrl || !apiKey) {
      return Response.json({ error: 'AI search is not configured' }, { status: 500 });
    }

    let res: Response;
    try {
      res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(15000),
      });
    } catch (e) {
      const timedOut = e instanceof DOMException && e.name === 'TimeoutError';
      return Response.json(
        { error: timedOut ? 'AI search timed out' : 'AI search unreachable' },
        { status: timedOut ? 504 : 502 }
      );
    }

    if (!res.ok) {
      return Response.json({ error: `AI search failed (${res.status})` }, { status: 502 });
    }

    const data = (await res.json().catch(() => null)) as AiSearchResponse | null;
    return Response.json({
      answer: typeof data?.answer === 'string' ? data.answer : '',
      matches: Array.isArray(data?.matches) ? data.matches : [],
      noMatchReason: typeof data?.no_match_reason === 'string' ? data.no_match_reason : null,
      rosterSize: typeof data?.roster_size === 'number' ? data.roster_size : null,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status >= 500) {
      console.error('Talent search error:', e);
    } else {
      console.warn(`Talent search ${status}: ${(e as Error).message ?? 'request rejected'}`);
    }
    return Response.json({ error: 'An error occurred' }, { status });
  }
}
