import { type NextRequest, NextResponse } from "next/server"

const SPEECH_KEY = process.env.AZURE_SPEECH_KEY
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus"

export async function POST(req: NextRequest) {
  try {
    if (!SPEECH_KEY) {
      return NextResponse.json({ error: "Azure Speech Key not configured" }, { status: 500 })
    }

    const { text, language } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 })
    }

    // Convert language code to Azure Voice name
    let voiceName = "en-US-JennyNeural"
    const langStr = String(language).toLowerCase()
    if (langStr.startsWith("sw")) voiceName = "sw-KE-ZuriNeural"
    else if (langStr.startsWith("fr")) voiceName = "fr-FR-DeniseNeural"
    else if (langStr.startsWith("es")) voiceName = "es-ES-ElviraNeural"
    // Add more mappings if necessary

    const ttsUrl = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`

    const ssml = `
      <speak version='1.0' xml:lang='en-US'>
        <voice xml:lang='en-US' xml:gender='Female' name='${voiceName}'>
          ${text.replace(/[&<>'"]/g, 
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' }[c] || c)
          )}
        </voice>
      </speak>`

    const response = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "FarmAdvisorTTS"
      },
      body: ssml,
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error("[tts] Azure Speech error:", response.status, detail)
      return NextResponse.json({ error: "TTS failed" }, { status: 502 })
    }

    const arrayBuffer = await response.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error) {
    console.error("[tts] Proxy error:", error)
    return NextResponse.json({ error: "TTS service unreachable" }, { status: 503 })
  }
}
