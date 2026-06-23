import { Agent, fetch as undiciFetch } from "undici"

const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 900_000)

const ollamaAgent = new Agent({
  headersTimeout: OLLAMA_TIMEOUT_MS,
  bodyTimeout: OLLAMA_TIMEOUT_MS,
  connectTimeout: 30_000,
})

export async function fetchOllama(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string },
) {
  return undiciFetch(url, {
    ...init,
    dispatcher: ollamaAgent,
  })
}
