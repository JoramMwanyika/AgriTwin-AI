/** Shared language config for chat, TTS, and Whisper STT */

export type ChatLanguage = {
  code: string
  name: string
  nativeName: string
}

export const CHAT_LANGUAGES: ChatLanguage[] = [
  { code: "en", name: "English (US)", nativeName: "English" },
  { code: "sw", name: "Swahili (Kenya)", nativeName: "Kiswahili" },
  { code: "kik", name: "Kikuyu (Kenya)", nativeName: "Gĩkũyũ" },
  { code: "luo", name: "Luo (Kenya)", nativeName: "Dholuo" },
  { code: "ha", name: "Hausa (Nigeria)", nativeName: "Hausa" },
  { code: "ig", name: "Igbo (Nigeria)", nativeName: "Igbo" },
  { code: "yo", name: "Yoruba (Nigeria)", nativeName: "Yorùbá" },
  { code: "zu", name: "Zulu (South Africa)", nativeName: "isiZulu" },
  { code: "xh", name: "Xhosa (South Africa)", nativeName: "isiXhosa" },
  { code: "af", name: "Afrikaans (South Africa)", nativeName: "Afrikaans" },
  { code: "am", name: "Amharic (Ethiopia)", nativeName: "አማርኛ" },
  { code: "rw", name: "Kinyarwanda (Rwanda)", nativeName: "Ikinyarwanda" },
  { code: "ln", name: "Lingala (DRC)", nativeName: "Lingála" },
]

/** Human-readable names for the LLM system prompt */
export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sw: "Swahili (Kiswahili)",
  ki: "Kikuyu (Gikuyu)",
  kik: "Kikuyu (Gikuyu)",
  luo: "Luo (Dholuo)",
  fr: "French",
  af: "Afrikaans",
  am: "Amharic",
  ar: "Arabic",
  ha: "Hausa",
  ig: "Igbo",
  rw: "Kinyarwanda",
  ln: "Lingala",
  lg: "Luganda",
  rn: "Kirundi",
  st: "Sesotho",
  nso: "Northern Sotho",
  tn: "Setswana",
  so: "Somali",
  ti: "Tigrinya",
  xh: "Xhosa",
  yo: "Yoruba",
  zu: "Zulu",
}

/** BCP-47 locales for browser speech synthesis */
export const TTS_LOCALE: Record<string, string> = {
  en: "en-US",
  sw: "sw-KE",
  kik: "en-KE",
  ki: "en-KE",
  luo: "en-KE",
  ha: "ha-NG",
  ig: "ig-NG",
  yo: "yo-NG",
  zu: "zu-ZA",
  xh: "xh-ZA",
  af: "af-ZA",
  am: "am-ET",
  rw: "rw-RW",
  ln: "ln-CD",
  fr: "fr-FR",
}

export const CHAT_GREETINGS: Record<string, string> = {
  en: "Hello! I am AgriTwin, your AI farm assistant. How can I help you today?",
  sw: "Habari! Mimi ni AgriTwin, msaidizi wako wa kilimo. Naweza kukusaidia vipi leo?",
  kik: "Wĩ mwega! Ni AgriTwin, mũtethia waku wa ũgĩĩci. Ndingĩkũteithĩria atĩa ũmũthĩ?",
  ki: "Wĩ mwega! Ni AgriTwin, mũtethia waku wa ũgĩĩci. Ndingĩkũteithĩria atĩa ũmũthĩ?",
  luo: "Ber ahinya! An AgriTwin, jakony mari mag pur. Anyalo konyi nade kawuono?",
  ha: "Sannu! Ni AgriTwin, mataimakin nomaninka. Yaya zan iya taimaka ma ka yau?",
  ig: "Ndewo! Abụ AgriTwin, onye enyemaka gị n'ugbo ọrụ. Kedu ka m ga-esi nyere gị aka taa?",
  yo: "Ẹ kú àárọ̀! Emi ni AgriTwin, olùrànlọ́wọ́ rẹ ní oko. Báwo ni mo ṣe le ràn ọ́ lọ́wọ́ lónìí?",
  zu: "Sawubona! Ngingu-AgriTwin, umsizi wakho wezolimo. Ngingakusiza kanjani namhlanje?",
  xh: "Molo! Ndingu-AgriTwin, umncedi wakho wolimo. Ndingakunceda njani namhlanje?",
  af: "Hallo! Ek is AgriTwin, jou landbou-assistent. Hoe kan ek jou vandag help?",
  am: "ሰላም! አግሪትዊን ነኝ፣ የእርሻ ረዳትዎ። ዛሬ እንዴት ልረዳዎ እችላለሁ?",
  rw: "Muraho! Ndi AgriTwin, umufasha wawe w'ubuhinzi. Nshobora kugufasha iki uyu munsi?",
  ln: "Mbote! Nazali AgriTwin, mokambi na yo ya bilanga. Nalingi kosalisa yo ndenge nini lelo?",
}

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    listening: "Listening... Speak now",
    tapToStart: "Tap the microphone to start speaking",
    processing: "Processing your request...",
    responding: "AgriTwin is responding...",
    listeningShort: "Listening...",
    noSpeech: "No speech detected.",
    transcribeError: "Failed to transcribe audio.",
    chatError: "Failed to get response from AgriTwin AI",
    waitResponse: "Please wait for the response to finish.",
    micError: "Could not access microphone",
  },
  sw: {
    listening: "Nasikiliza... Ongea sasa",
    tapToStart: "Gusa kipaza sauti kuanza kuongea",
    processing: "Inachakata ombi lako...",
    responding: "AgriTwin anajibu...",
    listeningShort: "Nasikiliza...",
    noSpeech: "Hakuna sauti iliyosikika.",
    transcribeError: "Imeshindwa kutafsiri sauti.",
    chatError: "Imeshindwa kupata jibu kutoka AgriTwin",
    waitResponse: "Tafadhali subiri jibu likamilike.",
    micError: "Haikuweza kufikia kipaza sauti",
  },
  kik: {
    listening: "Ndĩramũthikĩra... Aria rĩu",
    tapToStart: "Hutia kĩgera nĩguo ũambĩrĩrie kwaria",
    processing: "Ĩraharĩria ũhoro waku...",
    responding: "AgriTwin arĩarĩria...",
    listeningShort: "Ndĩramũthikĩra...",
    noSpeech: "Hatirĩ mũgambo wonwi.",
    transcribeError: "Nĩyaremwo gũthamia mũgambo.",
    chatError: "Nĩyaremwo kũgĩa na macokio kuuma AgriTwin",
    waitResponse: "Tegereirwo macokio marĩke.",
    micError: "Ndĩngĩhota kũhota kĩgera",
  },
  luo: {
    listening: "Awinjo... Wuoy sani",
    tapToStart: "Di mikrofon mondo ichak wuoyo",
    processing: "Loso kwayo mari...",
    responding: "AgriTwin dwoyo...",
    listeningShort: "Awinjo...",
    noSpeech: "Onge dwol ma owinyore.",
    transcribeError: "Otamore loko dwol.",
    chatError: "Otamore yudo dwoko kuom AgriTwin",
    waitResponse: "Kur kama dwoko orumo.",
    micError: "Ne ok nyal yudo mikrofon",
  },
}

const LANGUAGE_ALIASES: Record<string, string> = {
  english: "en",
  en_us: "en",
  swahili: "sw",
  kiswahili: "sw",
  gikuyu: "kik",
  gikũyũ: "kik",
  dholuo: "luo",
  luo: "luo",
}

const SUPPORTED_LANGUAGE_CODES = new Set([
  ...CHAT_LANGUAGES.map((l) => l.code),
  "en",
  "ki",
  "fr",
  "ar",
  "lg",
  "rn",
  "st",
  "nso",
  "tn",
  "so",
  "ti",
])

export function normalizeLanguageCode(code?: string): string {
  if (!code) return "en"
  const raw = String(code).trim().toLowerCase()
  const c = LANGUAGE_ALIASES[raw] ?? raw
  if (c === "ki") return "kik"
  if (SUPPORTED_LANGUAGE_CODES.has(c)) return c
  return "en"
}

/** Languages that must not share TTS/STT locale with another (avoid Kikuyu ↔ Swahili bleed) */
const EXCLUSIVE_FORBIDDEN: Record<string, string[]> = {
  sw: ["Kikuyu", "Gikuyu", "Gĩkũyũ", "Luo", "Dholuo", "English"],
  kik: ["Swahili", "Kiswahili", "Luo", "Dholuo", "English"],
  luo: ["Swahili", "Kiswahili", "Kikuyu", "Gikuyu", "English"],
  en: ["Swahili", "Kiswahili", "Kikuyu", "Gikuyu", "Luo"],
}

export function getLanguageName(code?: string): string {
  const normalized = normalizeLanguageCode(code)
  return LANGUAGE_NAMES[normalized] || LANGUAGE_NAMES[code || "en"] || "English"
}

/** ISO codes supported by Azure Translator for post-processing replies */
export const AZURE_TRANSLATOR_CODES: Record<string, string> = {
  en: "en",
  sw: "sw",
  ha: "ha",
  ig: "ig",
  yo: "yo",
  zu: "zu",
  xh: "xh",
  af: "af",
  am: "am",
  ar: "ar",
  fr: "fr",
  rw: "rw",
}

export function getAzureTranslatorCode(code?: string): string | null {
  const normalized = normalizeLanguageCode(code)
  return AZURE_TRANSLATOR_CODES[normalized] ?? null
}

/** Languages where we translate the model's English reply via Azure */
export function shouldTranslateReplyWithAzure(code?: string): boolean {
  const normalized = normalizeLanguageCode(code)
  if (normalized === "en") return false
  return getAzureTranslatorCode(normalized) !== null
}

export function getLanguageInstruction(code?: string): string {
  const normalized = normalizeLanguageCode(code)
  const name = getLanguageName(normalized)
  const forbidden = EXCLUSIVE_FORBIDDEN[normalized]?.join(", ") ?? "other languages"

  if (normalized === "en") {
    return `Respond in clear, accurate English only. Do not use ${forbidden}.`
  }

  return [
    `CRITICAL: The farmer selected ${name} (code: ${normalized}). Every word of your reply MUST be in ${name} only.`,
    `FORBIDDEN: Do not use ${forbidden}.`,
    `Ignore the language of earlier messages in the chat — they may be wrong. Only follow this language rule.`,
    `QUALITY: Same accurate farming advice as English; do not shorten.`,
    `STYLE: Natural ${name} for Kenyan farmers, not word-for-word English.`,
  ].join(" ")
}

const CHAT_SYSTEM_BASE = `You are AgriTwin, a friendly AI farming assistant for smallholder farmers in Kenya.
You advise on crop management, pests, weather, soil, irrigation, markets, and team tasks.
Keep answers concise, practical, and encouraging. Consider Kenyan conditions (maize, beans, tomatoes, etc.).
Use punctuation suitable for reading aloud in voice mode.
For plant disease image analysis: confirm identification, immediate actions, treatment, and prevention.
For task requests (e.g. "Tell John to water tomatoes"), acknowledge assignment naturally.
Answer the user's question directly; no meta status updates.`

export function buildChatSystemPrompt(
  blockContext: string,
  language: string,
  options: { replyViaAzureTranslation: boolean },
): string {
  const normalized = normalizeLanguageCode(language)
  const name = getLanguageName(normalized)

  let langBlock: string
  if (options.replyViaAzureTranslation) {
    langBlock = [
      `FARMER UI LANGUAGE: ${name} (code: ${normalized}).`,
      `You MUST write your entire reply in English only.`,
      `An automatic translator will convert English to ${name}.`,
      `Do NOT write in Kikuyu, Swahili, Luo, or any non-English language in your reply.`,
    ].join(" ")
  } else {
    langBlock = getLanguageInstruction(normalized)
  }

  return `${CHAT_SYSTEM_BASE}

CURRENT FARM STATUS:
${blockContext}

${langBlock}

ACTIVE_USER_LANGUAGE_CODE: ${normalized}`
}

/**
 * When Azure translates the reply, use the English Ollama model (avoids multilingual model drift).
 * Otherwise use OLLAMA_MULTILINGUAL_MODEL for languages without Azure support.
 */
export function getOllamaModel(
  language?: string,
  options?: { replyViaAzureTranslation?: boolean },
): string {
  const defaultModel = process.env.OLLAMA_MODEL || "qwen2.5:0.5b"
  const normalized = normalizeLanguageCode(language)
  if (options?.replyViaAzureTranslation || normalized === "en") {
    return defaultModel
  }
  return process.env.OLLAMA_MULTILINGUAL_MODEL || defaultModel
}

export function getChatGreeting(code?: string): string {
  const normalized = normalizeLanguageCode(code)
  return CHAT_GREETINGS[normalized] || CHAT_GREETINGS.en
}

export function getUIString(code: string | undefined, key: string): string {
  const normalized = normalizeLanguageCode(code)
  return UI_STRINGS[normalized]?.[key] || UI_STRINGS.en[key] || key
}

export function getTtsLocale(code?: string): string {
  const normalized = normalizeLanguageCode(code)
  return TTS_LOCALE[normalized] || TTS_LOCALE[code || "en"] || "en-US"
}

export function getLocalizedErrorMessage(code: string | undefined, type: "connection" | "invalid" | "generic"): string {
  const n = normalizeLanguageCode(code)
  const messages: Record<string, Record<string, string>> = {
    en: {
      connection: "I apologize, I'm having trouble connecting right now. Please try again in a moment.",
      invalid: "I received an unexpected response. Please try again.",
      generic: "Something went wrong. Please try again later.",
    },
    sw: {
      connection: "Samahani, nina shida ya kuunganisha sasa. Tafadhali jaribu tena baada ya muda mfupi.",
      invalid: "Nimepokea jibu lisilotarajiwa. Tafadhali jaribu tena.",
      generic: "Kuna tatizo. Tafadhali jaribu tena baadaye.",
    },
    kik: {
      connection: "Ndakwĩhoya, ndĩ na thĩna wa kuunganĩria rĩu. Geria rĩngĩ thuthainĩ.",
      invalid: "Nĩamũkĩra macokio matarĩ mo. Geria rĩngĩ.",
      generic: "Kũna thĩna. Geria rĩngĩ thuthainĩ.",
    },
    luo: {
      connection: "Kwayo marach, ok nyal tudore sani. Tem kendo bang'e matin.",
      invalid: "Ne ayudo dwoko maok owinjore. Tem kendo.",
      generic: "Nitiere chandruok. Tem kendo bang'e.",
    },
  }
  return messages[n]?.[type] || messages.en[type]
}
