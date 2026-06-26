import OpenAI from 'openai';

// Initialize the OpenAI client for Featherless API
export const openai = new OpenAI({
    baseURL: "https://api.featherless.ai/v1",
    apiKey: process.env.FEATHERLESS_API_KEY || "",
});

export async function generateCropKnowledge(cropName: string) {
    const systemPrompt = `
    You are an expert agronomist. Generate exactly 2 common diseases or pests for the crop '${cropName}' and their standard treatments.
    Output ONLY valid JSON in this exact format:
    {
      "crop": "${cropName}",
      "relationships": [
        {
          "disease_name": "name of disease/pest",
          "disease_type": "type of disease (e.g. Pest, Virus, Fungus)",
          "treatment_name": "name of treatment",
          "treatment_method": "method (e.g. Chemical Spray, Cultural, Biological)"
        }
      ]
    }
    `;
    
    try {
        const response = await openai.chat.completions.create({
            model: "Qwen/Qwen2.5-7B-Instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate diseases and treatments for ${cropName}.` }
            ],
            response_format: { type: "json_object" }
        });
        
        const responseContent = response.choices[0].message.content;
        if (responseContent) {
            return JSON.parse(responseContent);
        }
        return null;
    } catch (e) {
        console.error(`Error generating crop knowledge for ${cropName}:`, e);
        return null;
    }
}

export async function analyzeCropImage(base64Image: string, languageLabel: string) {
    const analysisPrompt = `You are an expert agricultural plant pathologist. Analyze this image and identify any plant diseases, pests, or health issues.

1. Identify if this appears to be a plant/crop image
2. If it's a plant, identify any visible diseases, pests, nutrient deficiencies, or health issues
3. Provide the likely disease/condition name
4. Rate the severity (Mild, Moderate, Severe, or Healthy)
5. List key symptoms visible
6. Provide an actionable recommendation on what to do next (TREATMENT).

VERY IMPORTANT: Translate your ENTIRE final JSON output (treatment, symptoms, summary, condition) into ${languageLabel}. Write as a native speaker.

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
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "Qwen/Qwen-VL-Chat",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: analysisPrompt },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                    ]
                }
            ],
            // Note: Qwen-VL-Chat might not perfectly support response_format json_object natively via this wrapper,
            // but we can try parsing the string output.
        });

        const gptContent = response.choices[0]?.message?.content || "";
        const jsonMatch = gptContent.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
        console.error("Featherless VLM Error:", error);
        return null;
    }
}
