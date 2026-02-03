import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-request-id',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const requestId = req.headers.get('x-client-request-id') || crypto.randomUUID();
    console.log(`[${requestId}] === THEME-REMIX START ===`);

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Unauthorized');

        const authClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized');

        const body = await req.json();
        const { prompt, baseTheme } = body;

        console.log(`[${requestId}] Remixing for user ${user.id} with prompt: ${prompt}`);

        /**
     * AI THEME REMIX LOGIC
     * Uses the "Safe Theme Mutation" system prompt to generate a curated variation.
     */

        const SYSTEM_PROMPT = `
Context
You are operating inside the VibeJam design system.
VibeJam has three immutable layers:
Truth layer (data, proof, signals) — DO NOT TOUCH
Layout layer (LayoutConfig, grid, placement) — DO NOT TOUCH
Theme layer (ThemeConfig + ThemeClasses) — THIS IS YOUR ONLY SCOPE
ThemeConfigV1 and ThemeClasses are canonical and already implemented.

🧠 Your Role
You are a controlled visual mutation engine.
Your job is to generate a new theme variant by mutating an existing theme, not inventing from scratch.
The output must feel: intentional, tasteful, coherent, emotionally distinct.
This is curated evolution, not randomness.

🚫 Hard Constraints (DO NOT BREAK)
You MUST NOT:
- Change layout or spacing
- Modify grid logic
- Introduce new ThemeConfig fields
- Remove required ThemeConfig fields
- Use inline styles
- Use absolute positioning
- Touch runtime or persistence logic

You MAY ONLY:
- Adjust values in ThemeConfig
- Adjust Tailwind class mappings in ThemeClasses

If any constraint is violated, abort and retry safely.

🧾 ThemeConfig Contract (Immutable Shape)
You may ONLY output this structure:
{
  version: 1,
  palette: 'light' | 'dark',
  surfaceStyle: 'flat' | 'glass' | 'soft' | 'raw',
  typographyStyle: 'system' | 'editorial' | 'playful',
  mood: 'calm' | 'serious' | 'joyful' | 'brutal' | 'atmospheric',
  accentIntensity: 'low' | 'medium' | 'high',
  backgroundTreatment: 'plain' | 'gradient' | 'texture'
}

🧬 Mutation Rules
When mutating:
- Start from the base theme provided in the user prompt
- Change no more than 2–3 ThemeConfig fields
- Preserve identity continuity
- Mutate ThemeClasses proportionally
- Maintain readability and contrast
- Avoid novelty for its own sake
This should feel like: the same theme, evolved

🧪 Quality Gates (Self-Check Before Output)
Before outputting, verify:
- Text remains legible (High contrast)
- Surfaces do not overpower content
- The theme feels intentional, not chaotic

🧾 Output Format (STRICT JSON)
Output ONLY the raw JSON object. No markdown. No comments.
{
  "config": { ...ThemeConfig fields... },
  "classes": {
    "page": "...",
    "surface": "...",
    "card": "...",
    "title": "...",
    "body": "...",
    "accent": "..."
  },
  "explanation": "Short, evocative description of the change (max 1 sentence)."
}
`;

        const openAiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAiKey) {
            // Fallback to mock if no key is present (for dev/demo safety)
            console.warn(`[${requestId}] No OPENAI_API_KEY found. Using mock response.`);
            const mockRemix = {
                config: {
                    ...baseTheme,
                    mood: prompt.includes('dark') ? 'serious' : 'joyful',
                    accentIntensity: 'high',
                    backgroundTreatment: 'texture'
                },
                classes: {
                    page: 'min-h-screen bg-zinc-950 text-zinc-100 bg-[radial-gradient(hsla(0,0%,100%,0.03)_1px,transparent_1px)] [background-size:20px_20px]',
                    surface: 'bg-zinc-900/50 backdrop-blur-xl',
                    card: 'rounded-none border-2 border-current shadow-[10px_10px_0_0_currentColor]',
                    title: 'font-serif italic font-light tracking-tight text-white',
                    body: 'font-serif leading-relaxed opacity-75 text-zinc-400',
                    accent: 'text-white underline decoration-zinc-500 underline-offset-[12px] decoration-2'
                },
                explanation: `(Mock) I've interpreted "${prompt}" as a high-signal brutalist identity. Add OPENAI_API_KEY to enable real AI.`
            };
            return new Response(JSON.stringify(mockRemix), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Call OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Use a high-quality model for art direction
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: JSON.stringify({ baseTheme, intent: prompt }) }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const aiData = await response.json();
        if (!response.ok) {
            throw new Error(aiData.error?.message || 'AI request failed');
        }

        const rawContent = aiData.choices[0]?.message?.content;
        if (!rawContent) throw new Error('No content from AI');

        // Parse JSON safely (handle potential markdown code fences)
        let parsedMatch;
        try {
            const cleanJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedMatch = JSON.parse(cleanJson);
        } catch (e) {
            console.error(`[${requestId}] Failed to parse AI JSON:`, rawContent);
            throw new Error('AI returned invalid JSON');
        }

        return new Response(JSON.stringify(parsedMatch), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error(`[${requestId}] ERROR:`, error.message);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: error.message === 'Unauthorized' ? 401 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
})
