const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = 'Tu es un assistant culinaire sympa et accessible. Tes réponses sont courtes, pratiques et chaleureuses.';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function askClaude(messages: Message[], systemPrompt = SYSTEM_PROMPT): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}

export async function suggestSubstitution(ingredient: string, recipeContext: string): Promise<string> {
  return askClaude([{
    role: 'user',
    content: `Je n'ai pas de "${ingredient}" pour cette recette : ${recipeContext}. Propose 2-3 substitutions possibles, de façon concise et sympa.`,
  }]);
}

export async function adjustPortions(recipeContext: string, fromPortions: number, toPortions: number): Promise<string> {
  return askClaude([{
    role: 'user',
    content: `Adapte les quantités de cette recette de ${fromPortions} à ${toPortions} portions : ${recipeContext}`,
  }]);
}
