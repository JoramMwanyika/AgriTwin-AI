import { BlockDailyRecommendation } from "./block-recommendations";

export async function generateAiRecommendationForBlock(
  blockName: string,
  cropType: string | null,
  moisture: number | null,
  temp: number | null,
  n: number | null,
  p: number | null,
  k: number | null
): Promise<Partial<BlockDailyRecommendation>> {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_MODEL = process.env.GITHUB_MODEL || "gpt-4o";
  let GITHUB_ENDPOINT = process.env.GITHUB_MODELS_ENDPOINT || "https://models.inference.ai.azure.com/chat/completions";
  if (!GITHUB_ENDPOINT.endsWith("/chat/completions")) {
    GITHUB_ENDPOINT = `${GITHUB_ENDPOINT.replace(/\/$/, "")}/chat/completions`;
  }

  if (!GITHUB_TOKEN) {
    throw new Error("No GITHUB_TOKEN found for AI generation");
  }

  const prompt = `
    You are an expert AI Agronomist for AgriTwin.
    Analyze the following farm block and provide a daily recommendation.
    
    Block Name: ${blockName}
    Current Crop: ${cropType || "None"}
    Soil Moisture: ${moisture !== null ? moisture + "%" : "Unknown"}
    Temperature: ${temp !== null ? temp + "°C" : "Unknown"}
    Nitrogen (N): ${n !== null ? n + " mg/kg" : "Unknown"}
    Phosphorus (P): ${p !== null ? p + " mg/kg" : "Unknown"}
    Potassium (K): ${k !== null ? k + " mg/kg" : "Unknown"}

    Respond EXACTLY in the following JSON format, with no markdown, no code blocks, and no extra text:
    {
      "healthScore": <number between 0 and 100>,
      "healthStatus": <one of: "excellent", "good", "fair", "poor", "critical">,
      "healthSummary": "<A 2-sentence summary of the soil health and crop conditions>",
      "actions": [
        "<Action 1>",
        "<Action 2>"
      ],
      "suitableCrops": [
        { "name": "<Crop Name 1>", "score": <number 0-100>, "reason": "<Why it suits this soil>" },
        { "name": "<Crop Name 2>", "score": <number 0-100>, "reason": "<Why it suits this soil>" }
      ]
    }
  `;

  const response = await fetch(GITHUB_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model: GITHUB_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API failed: ${await response.text()}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || "";
  
  // Clean up any markdown formatting just in case the AI includes it
  const cleanJson = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("Failed to parse AI recommendation JSON:", cleanJson);
    throw new Error("Invalid AI JSON response");
  }
}
