import { type NextRequest, NextResponse } from "next/server"
import { getLanguageName, normalizeLanguageCode } from "@/lib/languages"
import { openai } from "@/lib/ai"

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
      // We continue to AI Brain even if Vision fails, using just the image.
    }

    // Step 2: Use AI Brain (Featherless Qwen-VL-Chat) with Vision tags
    const analysisPrompt = `You are an expert agricultural plant pathologist. Analyze this image and identify any plant diseases, pests, or health issues.

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

    const gptResponse = await openai.chat.completions.create({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
            {
                role: "user",
                content: analysisPrompt
            }
        ],
        temperature: 0.3,
    });

    const gptContent = gptResponse.choices[0]?.message?.content || "";
    
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
