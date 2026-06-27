import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  buildChatSystemPrompt,
  getAzureTranslatorCode,
  getLanguageName,
  getLocalizedErrorMessage,
  getOllamaModel,
  normalizeLanguageCode,
  shouldTranslateReplyWithAzure,
} from "@/lib/languages"
import { fetchOllama } from "@/lib/ollama"
import { isAzureTranslatorConfigured, translateText } from "@/lib/azure-translate"
import OpenAI from 'openai';

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/v1/chat/completions"



export async function POST(req: NextRequest) {
  let language = "en"
  try {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { messages, imageAnalysis, language: rawLanguage } = body
    language = normalizeLanguageCode(rawLanguage)
    const userId = session.user.id

    // 1. Get or Create a generic Chat Session for this user (for now, single session per user or new one)
    let chatSession = null;
    try {
      chatSession = await db.chatSession.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      })

      if (!chatSession) {
        chatSession = await db.chatSession.create({
          data: {
            userId,
            title: "Farm Advisor Chat"
          }
        })
      }

      // 2. Save User Message
      const lastUserMessage = messages[messages.length - 1]
      if (lastUserMessage.role === 'user') {
        await db.chatMessage.create({
          data: {
            sessionId: chatSession.id,
            role: 'user',
            content: lastUserMessage.text || lastUserMessage.content, // Handle both formats if needed
            language: language,
            imageAnalysis: imageAnalysis ? JSON.parse(JSON.stringify(imageAnalysis)) : undefined
          }
        })
      }
    } catch (dbError) {
      console.warn("Database is unreachable. Proceeding without saving user chat history.");
    }

    const languageName = getLanguageName(language)
    // Disabled Azure translation: force the model to natively respond in the target language
    const useAzureForReply = false
    const modelName = getOllamaModel(language, { replyViaAzureTranslation: useAzureForReply })

    // Fetch Farm Block Context
    let blockContext = "No farm block data available.";
    try {
      const userFarms = await db.farm.findMany({
        where: { userId },
        include: {
          blocks: {
            include: {
              readings: {
                orderBy: { timestamp: 'desc' },
                take: 1
              }
            }
          }
        }
      });
      
      if (userFarms.length > 0) {
        const blocks = userFarms.flatMap(f => f.blocks);
        if (blocks.length > 0) {
          blockContext = blocks.map(b => {
            const reading = b.readings?.[0];
            const stats = reading ? `Moisture: ${reading.moisture}%, Temp: ${reading.temp}°C, NPK: ${reading.nitrogen}/${reading.phosphorus}/${reading.potassium}` : "No sensor data";
            return `- ${b.name} (Crop: ${b.cropType || 'Unknown'}, Status: ${b.status}). Sensors: ${stats}`;
          }).join("\n");
        }
      }
    } catch (dbError) {
      console.warn("Database unreachable. Using fallback block data for demo.");
      blockContext = `- North Field (Crop: Maize, Status: active). Sensors: Moisture: 32%, Temp: 28°C, NPK: 40/30/20\n- Greenhouse 1 (Crop: Tomatoes, Status: active). Sensors: Moisture: 65%, Temp: 24°C, NPK: 50/40/30`;
    }

    const historyLimit = language === "en" ? 10 : 2
    const recentMessages = (
      messages as { role: string; text?: string; content?: string }[]
    ).filter((m) => m.role === "user" || m.role === "ai" || m.role === "assistant").slice(-historyLimit)

    const apiMessages = [
      {
        role: "system",
        content: buildChatSystemPrompt(blockContext, language, {
          replyViaAzureTranslation: useAzureForReply,
        }),
      },
      ...recentMessages.map((m, idx, arr) => {
        const role = m.role === "ai" || m.role === "assistant" ? "assistant" : "user"
        let content = m.text || m.content || ""
        const isLastUser = role === "user" && idx === arr.length - 1
        if (isLastUser && language !== "en" && !useAzureForReply) {
          content = `${content}\n\n[Respond only in ${languageName}; code ${language}]`
        }
        return { role, content }
      }),
    ]

    const lastUserIdx = apiMessages.length - 1
    if (lastUserIdx >= 0 && apiMessages[lastUserIdx].role === "user" && imageAnalysis) {
      const userContent = apiMessages[lastUserIdx].content
      apiMessages[lastUserIdx].content =
        `[Image Analysis Results: ${imageAnalysis}]\n\nUser question: ${userContent}`
    }

    let aiMessageContent = "";
    let azureSuccess = false;

    const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;

    if (FEATHERLESS_API_KEY) {
      try {
        console.log(`[v0] Trying Featherless API Chat...`);
        
        const runtimeFeatherless = new OpenAI({
          baseURL: 'https://api.featherless.ai/v1',
          apiKey: FEATHERLESS_API_KEY, 
        });

        const completion = await runtimeFeatherless.chat.completions.create({
          model: "meta-llama/Meta-Llama-3.1-8B-Instruct",
          messages: apiMessages as any, // Bypass strict type checking for basic array
          temperature: language === "en" ? 0.5 : 0.35,
          max_tokens: 1500,
        });

        aiMessageContent = completion.choices[0]?.message?.content || "";
        if (aiMessageContent) {
          azureSuccess = true;
          console.log("[v0] Featherless API Success");
        }
      } catch (err) {
        console.warn("[v0] Featherless API Request Error:", err);
      }
    }

    if (!azureSuccess) {
      console.log(
        "[v0] Falling back to Ollama:",
        OLLAMA_URL,
        "model:",
        modelName,
        "language:",
        language,
        "(",
        languageName,
        ")",
        "azureTranslate:",
        useAzureForReply,
      )

      const ollamaResponse = await fetchOllama(OLLAMA_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: apiMessages,
          temperature: language === "en" ? 0.5 : 0.35,
          stream: false,
          keep_alive: "10m",
        }),
      })

      const responseText = await ollamaResponse.text()

      if (!ollamaResponse.ok) {
        console.error("[v0] Ollama Error:", ollamaResponse.status, responseText)
        return NextResponse.json(
          {
            error: "Failed to get AI response",
            message: getLocalizedErrorMessage(language, "connection"),
          },
          { status: 500 },
        )
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        console.error("[v0] JSON Parse Error:", responseText)
        return NextResponse.json(
          {
            error: "Invalid response format",
            message: getLocalizedErrorMessage(language, "invalid"),
          },
          { status: 500 },
        )
      }

      aiMessageContent = data.choices?.[0]?.message?.content || data.message?.content || "I apologize, I could not process your request."
    }

    if (useAzureForReply) {
      try {
        const azureTarget = getAzureTranslatorCode(language)!
        aiMessageContent = await translateText(aiMessageContent, "en", azureTarget)
        console.log("[v0] Translated reply to", azureTarget)
      } catch (translateErr) {
        console.warn("[v0] Azure translation failed, using model output:", translateErr)
      }
    }

    // 3. Save AI Response
    if (chatSession) {
      try {
        await db.chatMessage.create({
          data: {
            sessionId: chatSession.id,
            role: 'assistant',
            content: aiMessageContent,
            language: language,
          }
        })
      } catch (dbError) {
        console.warn("Database is unreachable. Could not save AI response.");
      }
    }

    return NextResponse.json({ message: aiMessageContent })
  } catch (error) {
    console.error("[v0] Chat API Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: getLocalizedErrorMessage(language, "generic"),
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const chatSession = await db.chatSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!chatSession) {
      return NextResponse.json([])
    }

    return NextResponse.json(chatSession.messages)
  } catch (error) {
    console.error("Failed to fetch chat history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
