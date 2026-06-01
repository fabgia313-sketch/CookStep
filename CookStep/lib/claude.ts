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

// ─── Simple fetch (pas de streaming — compatible Expo Go Android) ─────────────
async function fetchMessage(
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
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages,
      }),
      signal,
    });
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const message = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    onError(`Impossible de contacter l'assistant : ${message}`);
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

  if (signal?.aborted) return;

  let data: { content: Array<{ text: string }> };
  try {
    data = await response.json() as { content: Array<{ text: string }> };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Réponse invalide';
    onError(`Impossible de lire la réponse : ${message}`);
    return;
  }

  const text = data.content?.[0]?.text ?? '';
  if (!text) {
    onError("L'assistant n'a pas renvoyé de réponse.");
    return;
  }

  onChunk(text);
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

  await fetchMessage(
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
