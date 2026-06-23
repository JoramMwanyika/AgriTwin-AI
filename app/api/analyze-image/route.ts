import { type NextRequest, NextResponse } from "next/server"
import { getLanguageName, normalizeLanguageCode } from "@/lib/languages"

// Azure Computer Vision for image analysis
const VISION_ENDPOINT = process.env.AZURE_VISION_ENDPOINT!
const VISION_KEY = process.env.AZURE_VISION_KEY!

// Azure GPT-4 for disease analysis
const GPT_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!
const GPT_KEY = process.env.AZURE_OPENAI_KEY!
const GPT_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview"

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

    // Step 1: Analyze image with Azure Computer Vision
    // Removed 'caption,denseCaptions' as they are not supported in all Azure regions
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

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text()
      console.error("Vision API Error:", visionResponse.status, errorText)
      return NextResponse.json({ error: "Failed to analyze image", details: errorText }, { status: 500 })
    }

    const visionText = await visionResponse.text()
    let visionData;
    try {
      visionData = JSON.parse(visionText)
    } catch {
      console.error("Vision API JSON Parse Error:", visionText)
      return NextResponse.json({ error: "Invalid response from Vision API" }, { status: 500 })
    }

    // Extract relevant information
    const caption = visionData.captionResult?.text || "Image visual features extracted"
    const tags = visionData.tagsResult?.values?.map((t: { name: string }) => t.name).join(", ") || ""
    const denseCaptions = visionData.denseCaptionsResult?.values?.map((c: { text: string }) => c.text).join("; ") || ""

    // Step 2: Use GitHub Models (gpt-4o) with Vision to analyze for plant diseases
    const analysisPrompt = `You are an expert agricultural plant pathologist. Analyze this image and identify any plant diseases, pests, or health issues.

Computer Vision Tags: ${tags}

Based on this image and the provided tags:
1. Identify if this appears to be a plant/crop image
2. If it's a plant, identify any visible diseases, pests, nutrient deficiencies, or health issues
3. Provide the likely disease/condition name
4. Rate the severity (Mild, Moderate, Severe, or Healthy)
5. List key symptoms visible
6. Provide an actionable recommendation on what to do next (TREATMENT).

VERY IMPORTANT: ${
      languageCode === "en"
        ? "Write all JSON string values in English."
        : `Translate your ENTIRE final JSON output (treatment, symptoms, summary, condition) into ${languageLabel}. Write as a native speaker; do not leave English in string values.`
    } 

Respond in this exact JSON format:
{
  "isPlant": true/false,
  "plantType": "identified plant or crop type",
  "condition": "disease or condition name, or 'Healthy' if no issues",
  "severity": "Mild/Moderate/Severe/Healthy",
  "symptoms": ["symptom 1", "symptom 2"],
  "confidence": "High/Medium/Low",
  "summary": "Brief 1-2 sentence summary for farmer",
  "treatment": "Actionable recommendation or treatment plan that the farmer should do right now."
}`

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_MODEL = process.env.GITHUB_MODEL || "gpt-4o";
    let GITHUB_ENDPOINT = process.env.GITHUB_MODELS_ENDPOINT || "https://models.inference.ai.azure.com/chat/completions";
    if (!GITHUB_ENDPOINT.endsWith("/chat/completions")) {
      GITHUB_ENDPOINT = `${GITHUB_ENDPOINT.replace(/\/$/, "")}/chat/completions`;
    }

    const mimeType = imageFile.type || "image/jpeg"
    const base64Image = buffer.toString("base64")
    const dataUrl = `data:${mimeType};base64,${base64Image}`

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
    })

    if (!gptResponse.ok) {
      const errorText = await gptResponse.text()
      console.error("GPT Analysis Error:", gptResponse.status, errorText)
      // Return basic vision results if GPT fails
      return NextResponse.json({
        analysis: {
          isPlant: tags.toLowerCase().includes("plant") || tags.toLowerCase().includes("leaf"),
          plantType: "Unknown",
          condition: "Analysis unavailable",
          severity: "Unknown",
          symptoms: [],
          confidence: "Low",
          summary: caption,
          treatment: "Unable to generate treatment plan."
        },
        rawVision: { caption, tags, denseCaptions },
      })
    }

    const gptText = await gptResponse.text()
    let gptData;
    try {
      gptData = JSON.parse(gptText)
    } catch {
      console.error("GPT API JSON Parse Error:", gptText)
      gptData = {}
    }
    const gptContent = gptData.choices?.[0]?.message?.content || ""

    let analysis
    try {
      const jsonMatch = gptContent.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      
      if (!analysis || !analysis.severity || !analysis.condition) {
        throw new Error("Missing required fields in GPT response")
      }
    } catch {
      analysis = { 
        isPlant: false,
        plantType: "Unknown",
        condition: "Analysis unavailable", 
        severity: "Unknown",
        symptoms: [],
        confidence: "Low",
        summary: gptContent || "Failed to generate a valid analysis. Please try again.",
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
