// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT =
  'Tu es un assistant culinaire chaleureux, sympa et accessible. ' +
  'Tes réponses sont courtes, concrètes et pleines de bonne humeur. ' +
  'Tu tutoies toujours.';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SubstitutionContext {
  recipeTitle: string;
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>;
  currentStep?: string;
}

// ─── Streaming SSE ────────────────────────────────────────────────────────────
async function streamMessages(
  messages: Message[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    onError('Clé API Anthropic manquante. Vérifie ton fichier .env.');
    return;
  }

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        stream: true,
        messages,
      }),
      signal,
    });
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const msg = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    onError(`Impossible de contacter l'assistant : ${msg}`);
    return;
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json() as { error?: { message?: string } };
      detail = body?.error?.message ?? '';
    } catch { /* ignore */ }
    onError(`Erreur API (${response.status})${detail ? ` : ${detail}` : ''}.`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError("Le streaming n'est pas supporté sur cet appareil.");
    return;
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal?.aborted) return;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload) as {
            type: string;
            delta?: { type: string; text?: string };
          };
          if (
            parsed.type === 'content_block_delta' &&
            parsed.delta?.type === 'text_delta' &&
            typeof parsed.delta.text === 'string'
          ) {
            onChunk(parsed.delta.text);
          }
        } catch {
          if (__DEV__) console.warn('[claude.ts] SSE parse error:', trimmed);
        }
      }
    }
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const msg = err instanceof Error ? err.message : 'Erreur de lecture';
    onError(`Lecture interrompue : ${msg}`);
    return;
  } finally {
    reader.releaseLock();
  }

  onDone();
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getSubstitution(
  missingIngredient: string,
  context: SubstitutionContext,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const ingredientList = context.ingredients
    .map((ing) => {
      const qty = ing.quantity != null ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : '';
      return qty ? `${qty} ${ing.name}` : ing.name;
    })
    .join(', ');

  const stepCtx = context.currentStep
    ? `\nÉtape en cours : "${context.currentStep}"`
    : '';

  const userMessage =
    `Je prépare "${context.recipeTitle}". ` +
    `Je n'ai pas de **${missingIngredient}** et j'ai besoin d'une substitution.\n` +
    `Ingrédients disponibles dans la recette : ${ingredientList}.` +
    stepCtx +
    `\n\nPropose-moi 2-3 substitutions concrètes et rapides. ` +
    `Sois chaleureux, concis, et donne les proportions si nécessaire.`;

  await streamMessages(
    [{ role: 'user', content: userMessage }],
    onChunk, onDone, onError, signal,
  );
}

export async function askClaude(
  messages: Message[],
  systemPrompt = SYSTEM_PROMPT,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Clé API Anthropic manquante.');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);
  const data = await response.json() as { content: Array<{ text: string }> };
  return data.content[0].text;
}
