/** Server-side Azure Translator helper (used by /api/chat) */

const TRANSLATOR_ENDPOINT =
  process.env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com"
const TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY
const REGION = process.env.AZURE_TRANSLATOR_REGION || "eastus"

export function isAzureTranslatorConfigured(): boolean {
  return Boolean(TRANSLATOR_KEY?.trim())
}

export async function translateText(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  if (!text?.trim() || from === to) return text
  if (!isAzureTranslatorConfigured()) return text

  const response = await fetch(
    `${TRANSLATOR_ENDPOINT}/translate?api-version=3.0&from=${from}&to=${to}`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": TRANSLATOR_KEY!,
        "Ocp-Apim-Subscription-Region": REGION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ text }]),
    },
  )

  if (!response.ok) {
    const err = await response.text()
    console.error("[translate] Azure error:", response.status, err)
    throw new Error("Translation failed")
  }

  const data = await response.json()
  return data[0]?.translations?.[0]?.text || text
}
