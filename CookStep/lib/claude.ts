// ─── Constants ────────────────────────────────────────────────────────────────
const MODEL = 'claude-sonnet-4-20250514';
const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT =
  'Tu es un assistant culinaire chaleureux, sympa et accessible. ' +
  'Tes réponses sont courtes, concrètes et pleines de bonne humeur. ' +
  'Tu tutoies toujours.';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SubstitutionContext {
  recipeTitle: string;
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>;
  currentStep?: string;
}

// ─── SSE streaming parser ─────────────────────────────────────────────────────
/**
 * Calls the Anthropic Messages API in streaming mode.
 * Parses SSE events line by line and fires callbacks for each text chunk.
 *
 * @param messages     - Conversation messages
 * @param onChunk      - Called with each text token received
 * @param onDone       - Called when stream ends successfully
 * @param onError      - Called with a human-readable error message on failure
 * @param signal       - Optional AbortSignal to cancel the request
 */
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
    if (signal?.aborted) return; // Intentional abort — silent
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    onError(`Impossible de contacter l'assistant : ${message}`);
    return;
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json() as { error?: { message?: string } };
      detail = body?.error?.message ?? '';
    } catch {
      // Ignore JSON parse error on error body
    }
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

      // Split on newlines — keep last (possibly incomplete) chunk in buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice(6); // Remove "data: "
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
          // Skip malformed JSON lines (ping events, etc.)
          if (__DEV__) {
            console.warn('[claude.ts] Unparseable SSE line:', trimmed);
          }
        }
      }
    }
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const message = err instanceof Error ? err.message : 'Erreur de lecture du stream';
    onError(`Lecture interrompue : ${message}`);
    return;
  } finally {
    reader.releaseLock();
  }

  onDone();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Suggests substitutions for a missing ingredient, streaming the response.
 *
 * @param missingIngredient - The ingredient the user doesn't have
 * @param context           - Recipe context (title, full ingredients list, current step)
 * @param onChunk           - Called with each text token as it arrives
 * @param onDone            - Called when the response is complete
 * @param onError           - Called with a human-readable error message
 * @param signal            - Optional AbortSignal to cancel mid-stream
 */
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

  const stepContext = context.currentStep
    ? `\nÉtape en cours : "${context.currentStep}"`
    : '';

  const userMessage =
    `Je prépare "${context.recipeTitle}". ` +
    `Je n'ai pas de **${missingIngredient}** et j'ai besoin d'une substitution.\n` +
    `Ingrédients disponibles dans la recette : ${ingredientList}.` +
    stepContext +
    `\n\nPropose-moi 2-3 substitutions concrètes et rapides. ` +
    `Sois chaleureux, concis, et donne les proportions si nécessaire.`;

  await streamMessages(
    [{ role: 'user', content: userMessage }],
    onChunk,
    onDone,
    onError,
    signal,
  );
}

/**
 * Non-streaming helper — kept for other use cases (portions, etc.)
 */
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

export async function suggestSubstitution(
  ingredient: string,
  recipeContext: string,
): Promise<string> {
  return askClaude([{
    role: 'user',
    content: `Je n'ai pas de "${ingredient}" pour cette recette : ${recipeContext}. Propose 2-3 substitutions possibles.`,
  }]);
}

export async function adjustPortions(
  recipeContext: string,
  fromPortions: number,
  toPortions: number,
): Promise<string> {
  return askClaude([{
    role: 'user',
    content: `Adapte les quantités de cette recette de ${fromPortions} à ${toPortions} portions : ${recipeContext}`,
  }]);
}
