"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ChatOverlay } from "./chat-overlay";
import { useSession } from "next-auth/react";
import { normalizeLanguageCode } from "@/lib/languages";

const STORAGE_KEY = "agritwin_chat_language";

interface ChatContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  language: string;
  setLanguage: (code: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguageState] = useState("en");
  const { data: session } = useSession();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setLanguageState(normalizeLanguageCode(saved));
  }, []);

  const setLanguage = useCallback((code: string) => {
    const normalized = normalizeLanguageCode(code);
    setLanguageState(normalized);
    localStorage.setItem(STORAGE_KEY, normalized);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("agritwin-language-change", { detail: normalized }));
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen: isOpen,
        openChat: () => setIsOpen(true),
        closeChat: () => setIsOpen(false),
        toggleChat: () => setIsOpen((prev) => !prev),
        language,
        setLanguage,
      }}
    >
      {children}
      {session && (
        <ChatOverlay
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          language={language}
          onLanguageChange={setLanguage}
        />
      )}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
