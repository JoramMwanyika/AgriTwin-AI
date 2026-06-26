import { type NextRequest, NextResponse } from "next/server"
import { getLanguageName, normalizeLanguageCode } from "@/lib/languages"

// Azure Computer Vision for image analysis
const VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT!
const VISION_KEY = process.env.AZURE_VISION_KEY!

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get("image") as File
    const languageCode = normalizeLanguageCode((formData.get("language") as string) || "en")
    const languageLabel = getLanguageName(languageCode)

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")
    const mimeType = imageFile.type || "image/jpeg"
    const dataUrl = `data:${mimeType};base64,${base64Image}`

    // Step 1: Analyze image with Azure Computer Vision
    const visionResponse = await fetch(
      `${VISION_ENDPOINT}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=tags,objects`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Ocp-Apim-Subscription-Key": VISION_KEY,
        },
        body: buffer,
      },
    )

    let tags = ""
    let caption = "Image visual features extracted"
    let denseCaptions = ""

    if (visionResponse.ok) {
      const visionData = await visionResponse.json()
      caption = visionData.captionResult?.text || caption
      tags = visionData.tagsResult?.values?.map((t: { name: string }) => t.name).join(", ") || ""
      denseCaptions = visionData.denseCaptionsResult?.values?.map((c: { text: string }) => c.text).join("; ") || ""
    } else {
      console.error("Vision API Error:", visionResponse.status, await visionResponse.text())
    }

    // Step 2: Use GitHub Models (gpt-4o) as the Multi-Modal Brain
    const analysisPrompt = `You are an expert agricultural plant pathologist. Analyze this image and identify any plant diseases, pests, or health issues. You have the ability to identify all types of crops and diseases affecting them.

Computer Vision Tags: ${tags}
Computer Vision Caption: ${caption}

Based on this image and the provided tags:
1. Identify if this appears to be a plant/crop image
2. If it's a plant, identify any visible diseases, pests, nutrient deficiencies, or health issues
3. Provide the likely disease/condition name
4. Rate the severity (Mild, Moderate, Severe, or Healthy)
5. List key symptoms visible
6. Provide an actionable recommendation on what to do next (TREATMENT).

VERY IMPORTANT: Translate your ENTIRE final JSON output (treatment, symptoms, summary, condition) into ${languageLabel}. Write as a native speaker; do not leave English in string values.

Respond in this exact JSON format:
{
  "isPlant": true,
  "plantType": "identified plant or crop type",
  "condition": "disease or condition name, or 'Healthy' if no issues",
  "severity": "Mild/Moderate/Severe/Healthy",
  "symptoms": ["symptom 1", "symptom 2"],
  "confidence": "High/Medium/Low",
  "summary": "Brief 1-2 sentence summary for farmer",
  "treatment": "Actionable recommendation or treatment plan that the farmer should do right now."
}
Only output the JSON object, nothing else.`;

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_MODEL = process.env.GITHUB_MODEL || "gpt-4o";
    let GITHUB_ENDPOINT = process.env.GITHUB_MODELS_ENDPOINT || "https://models.inference.ai.azure.com/chat/completions";
    if (!GITHUB_ENDPOINT.endsWith("/chat/completions")) {
      GITHUB_ENDPOINT = `${GITHUB_ENDPOINT.replace(/\/$/, "")}/chat/completions`;
    }

    const gptResponse = await fetch(GITHUB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        model: GITHUB_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert agricultural plant pathologist. Always respond with valid JSON.",
          },
          { 
            role: "user", 
            content: [
              { type: "text", text: analysisPrompt },
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    let gptContent = "";
    if (gptResponse.ok) {
        const gptData = await gptResponse.json();
        gptContent = gptData.choices?.[0]?.message?.content || "";
    } else {
        console.error("Brain API Error:", gptResponse.status, await gptResponse.text());
    }
    
    let analysis;
    try {
      const jsonMatch = gptContent.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      if (!analysis || !analysis.severity || !analysis.condition) {
        throw new Error("Missing required fields in Brain response");
      }
    } catch {
      console.error("Failed to parse Brain response:", gptContent);
      analysis = { 
        isPlant: false,
        plantType: "Unknown",
        condition: "Analysis unavailable", 
        severity: "Unknown",
        symptoms: [],
        confidence: "Low",
        summary: "Failed to generate a valid analysis from the AI brain. Please try again.",
        treatment: "Please try taking another clear picture of the plant."
      }
    }

    return NextResponse.json({
      analysis,
      rawVision: { caption, tags, denseCaptions },
    })
  } catch (error) {
    console.error("Image Analysis Error:", error)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
  }
}
