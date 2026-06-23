import { getTtsLocale } from "@/lib/languages"

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

const WHISPER_API = "/api/transcribe"

export async function startLocalRecording(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  mediaRecorder = new MediaRecorder(stream)
  audioChunks = []

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data)
    }
  }

  mediaRecorder.start(250)
}

export async function stopLocalRecordingAndTranscribe(language: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      reject(new Error("No recording in progress"))
      return
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
      audioChunks = []

      if (mediaRecorder) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      }
      mediaRecorder = null

      try {
        const formData = new FormData()
        formData.append("audio", audioBlob, "recording.webm")
        formData.append("language", language)

        const response = await fetch(WHISPER_API, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          let message = "Failed to transcribe audio"
          try {
            const err = await response.json()
            message = err.message || err.error || message
          } catch {
            /* ignore */
          }
          throw new Error(message)
        }

        const data = await response.json()
        resolve((data.text as string) || "")
      } catch (error) {
        console.error("Transcription error:", error)
        reject(error)
      }
    }

    mediaRecorder.stop()
  })
}

export function cancelLocalRecording(): void {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop()
    mediaRecorder.stream.getTracks().forEach((track) => track.stop())
    mediaRecorder = null
    audioChunks = []
  }
}

function pickVoiceForLocale(locale: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const exact = voices.find((v) => v.lang === locale)
  if (exact) return exact

  const prefix = locale.split("-")[0]
  const partial = voices.find((v) => v.lang.startsWith(prefix))
  if (partial) return partial

  return voices.find((v) => v.lang.startsWith("en")) || voices[0]
}

let cachedToken: { token: string; region: string; expiresAt: number } | null = null;

async function getAzureSpeechToken(): Promise<{ token: string; region: string } | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { token: cachedToken.token, region: cachedToken.region };
  }

  try {
    const res = await fetch("/api/speech/token")
    if (!res.ok) return null
    const data = await res.json()
    
    // Cache the token for 9 minutes (Azure tokens expire in 10 minutes)
    cachedToken = {
      token: data.token,
      region: data.region,
      expiresAt: Date.now() + 9 * 60 * 1000,
    };
    
    return data
  } catch (error) {
    console.error("Token fetch error:", error)
    return null
  }
}

let activeSynthesizer: any = null;

export function stopSpeaking(): void {
  try {
    window.speechSynthesis?.cancel();
    if (activeSynthesizer) {
      activeSynthesizer.close();
      activeSynthesizer = null;
    }
  } catch (e) {
    console.error("Error stopping speech:", e);
  }
}

export async function speakText(text: string, language = "en"): Promise<void> {
  const clean = text.replace(/[*_#`[\]]/g, "").trim()
  if (!clean) return

  stopSpeaking(); // Stop any currently playing audio

  const credentials = await getAzureSpeechToken()
  if (!credentials) {
    console.error("Failed to get speech token for TTS")
    return
  }

  try {
    const sdk = await import("microsoft-cognitiveservices-speech-sdk")
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(credentials.token, credentials.region)
    speechConfig.speechSynthesisLanguage = getTtsLocale(language)
    
    // For specific African languages without dedicated locales, fallback to Swahili to avoid an English accent
    const langStr = language.toLowerCase()
    if (langStr.startsWith("ki") || langStr.startsWith("luo") || langStr.startsWith("lg") || langStr.startsWith("rn")) {
       speechConfig.speechSynthesisVoiceName = "sw-KE-ZuriNeural"
    } else if (langStr.startsWith("ha") || langStr.startsWith("ig") || langStr.startsWith("yo")) {
       speechConfig.speechSynthesisVoiceName = "en-NG-EzinneNeural"
    }

    const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput()
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig)
    activeSynthesizer = synthesizer;

    return new Promise((resolve) => {
      synthesizer.speakTextAsync(
        clean,
        (result) => {
          if (activeSynthesizer === synthesizer) activeSynthesizer = null;
          synthesizer.close()
          resolve()
        },
        (error) => {
          console.error("Speech synthesis failed:", error)
          if (activeSynthesizer === synthesizer) activeSynthesizer = null;
          synthesizer.close()
          resolve()
        }
      )
    })
  } catch (err) {
    console.error("Error in speakText:", err)
  }
}

export async function startSpeechRecognition(
  onResult: (text: string, language: string) => void,
  onError: (error: string) => void,
  language = "en",
): Promise<{ stop: () => void } | null> {
  const credentials = await getAzureSpeechToken()
  if (!credentials) {
    onError("Failed to authenticate with speech service")
    return null
  }

  try {
    const sdk = await import("microsoft-cognitiveservices-speech-sdk")
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(credentials.token, credentials.region)
    speechConfig.speechRecognitionLanguage = getTtsLocale(language)
    
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)

    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        onResult(e.result.text, language)
      }
    }

    recognizer.canceled = (s, e) => {
      if (e.reason === sdk.CancellationReason.Error) {
        onError(e.errorDetails)
      }
    }

    recognizer.recognizeOnceAsync(
      (result) => {
        if (result.reason === sdk.ResultReason.NoMatch) {
          // It timed out or heard nothing. Call onResult with empty string to reset UI
          onResult("", language)
        }
        try { recognizer.close() } catch(e) {}
      },
      (err) => {
        onError(err)
        try { recognizer.close() } catch(e) {}
      }
    )

    return { 
      stop: () => {
        try { recognizer.close() } catch(e) {}
      } 
    }
  } catch (err: any) {
    onError(err.message || "Failed to initialize Azure Speech")
    return null
  }
}

export async function startContinuousRecognition(
  onResult: (text: string, language: string) => void,
  onError: (error: string) => void,
  onListening: (isListening: boolean) => void,
  language = "en",
): Promise<{ stop: () => void } | null> {
  const credentials = await getAzureSpeechToken()
  if (!credentials) {
    onError("Failed to authenticate with speech service")
    return null
  }

  try {
    const sdk = await import("microsoft-cognitiveservices-speech-sdk")
    const speechConfig = sdk.SpeechConfig.fromAuthorizationToken(credentials.token, credentials.region)
    speechConfig.speechRecognitionLanguage = getTtsLocale(language)
    
    // Create audio config with default microphone
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)

    let isStopping = false

    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text.trim()) {
        onResult(e.result.text, language)
      }
    }

    recognizer.sessionStarted = (s, e) => {
      onListening(true)
    }

    recognizer.sessionStopped = (s, e) => {
      onListening(false)
    }

    recognizer.canceled = (s, e) => {
      if (e.reason === sdk.CancellationReason.Error && !isStopping) {
        onError(e.errorDetails)
      }
    }

    recognizer.startContinuousRecognitionAsync(
      () => {
        // Started successfully
      },
      (err) => {
        onError(err)
      }
    )

    return {
      stop: () => {
        isStopping = true
        try {
          recognizer.stopContinuousRecognitionAsync(
            () => { recognizer.close() },
            () => { recognizer.close() }
          )
        } catch (e) {
          console.error("Error stopping recognition:", e)
        }
      },
    }
  } catch (err: any) {
    onError(err.message || "Failed to initialize Azure Speech")
    return null
  }
}
