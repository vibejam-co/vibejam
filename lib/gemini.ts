// Gemini API Client (Fetch Version)
// Note: This requires VITE_GEMINI_API_KEY to be set in .env
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

const GEMINI_SYSTEM_PROMPT = `
You are a world-class digital art director designing spatial composition for a product page.
You design spatial hierarchy, not visual styles.
You output structured layout plans only.

You are deciding how to arrange 4 key regions:
1. "hero" (The main headline/hook)
2. "narrative" (The story/content)
3. "proof" (Social proof, numbers, trust)
4. "identity" (The creator's brand/signature)

Your job is to interpret the user's "intent" (mood, vibe, audience) and generate a JSON layout plan.

RULES:
- NO CSS. NO Tailwind. NO Colors. NO Fonts.
- ONLY Spatial decisions: Placement, Size, Emphasis, Density.
- STRICT JSON output matching the schema provided.
- NO prose. NO markdown code blocks. Just the raw JSON string.

CONCEPTUAL GUIDANCE:
- "Cinematic/Intimidating": High density, overlapping elements, dominant hero, asymmetric.
- "Institutional/Trust": low density, centered alignment, no overlap, balanced.
- "Experimental": chaotic ordering, overlay placements, high density.
- "Editorial": balanced, readable, clear hierarchy.

SCHEMA (JamCanvasPlan partial):
{
  "canvasMode": "editorial" | "poster" | "gallery" | "manifesto",
  "regions": {
    "hero": { "placement": "top"|"center"|"side"|"overlay"|"bottom", "emphasis": "dominant"|"standard"|"minor" },
    "narrative": { "placement": "top"|"center"|"side"|"overlay"|"bottom", "emphasis": "dominant"|"standard"|"minor" },
    "proof": { "placement": "top"|"center"|"side"|"overlay"|"bottom", "emphasis": "dominant"|"standard"|"minor" },
    "identity": { "placement": "top"|"center"|"side"|"overlay"|"bottom", "emphasis": "dominant"|"standard"|"minor" }
  },
  "spatialRules": {
    "alignment": "centered" | "asymmetric",
    "overlap": boolean,
    "density": number (0.0 to 1.0)
  },
  "order": ["hero", "narrative", "proof", "identity"] (order these arrays based on visual priority)
}
`;

export async function generateGeminiLayout(intent: string): Promise<any> {
    if (!API_KEY) {
        return null;
    }

    const modelCandidates = [
        'gemini-3-flash',
        'gemini-3-pro'
    ];

    try {
        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: `System: ${GEMINI_SYSTEM_PROMPT}\n\nUser Design Intent: "${intent}"` }]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        };

        for (const model of modelCandidates) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                continue;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) continue;

            try {
                return JSON.parse(text);
            } catch {
                continue;
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}
