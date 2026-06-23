import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const WHISPER_BACKEND_URL =
  process.env.WHISPER_BACKEND_URL || "http://127.0.0.1:8000/transcribe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const audio = formData.get("audio")
    const language = formData.get("language") || "en"

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 })
    }

    const SPEECH_KEY = process.env.AZURE_SPEECH_KEY
    const SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus"

    if (!SPEECH_KEY) {
      return NextResponse.json({ error: "Azure Speech Key not configured" }, { status: 500 })
    }

    // Convert language code if needed. Azure expects full locale like en-US, sw-KE, etc.
    let locale = "en-US"
    const langStr = String(language).toLowerCase()
    if (langStr.startsWith("sw")) locale = "sw-KE"
    else if (langStr.startsWith("fr")) locale = "fr-FR"
    else if (langStr.startsWith("es")) locale = "es-ES"
    // add more if necessary

    const sttUrl = `https://${SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${locale}`

    const response = await fetch(sttUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "audio/webm; codecs=opus",
        "Accept": "application/json"
      },
      body: audio, // audio is a Blob
    })

    if (!response.ok) {
      const detail = await response.text()
      console.error("[transcribe] Azure Speech error:", response.status, detail)
      return NextResponse.json(
        {
          error: "Transcription failed",
          message: "Voice transcription service failed to process audio.",
        },
        { status: 502 },
      )
    }

    const data = await response.json()
    // Azure STT returns the recognized text in the DisplayText or text field
    const recognizedText = data.DisplayText || data.text || ""
    
    return NextResponse.json({ text: recognizedText })
  } catch (error) {
    console.error("[transcribe] Proxy error:", error)
    return NextResponse.json(
      {
        error: "Transcription service unreachable",
        message: "Failed to connect to Azure Speech API.",
      },
      { status: 503 },
    )
  }
}
