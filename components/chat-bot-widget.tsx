"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Globe, Loader2, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/components/chat-provider";
import { CHAT_LANGUAGES, getChatGreeting, getUIString, normalizeLanguageCode } from "@/lib/languages";

interface Message {
    id: string;
    role: "ai" | "user";
    text: string;
}

export function ChatBotWidget() {
    const { data: session, status } = useSession();
    const { language, setLanguage } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([
            {
                id: "init",
                role: "ai",
                text: getChatGreeting(language),
            },
        ]);
    }, [language]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    if (status !== "authenticated" || !session?.user) return null;

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userText = inputValue.trim();
        setInputValue("");

        const newMessages: Message[] = [
            ...messages,
            { id: Date.now().toString(), role: "user", text: userText },
        ];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            const activeLanguage = normalizeLanguageCode(language);
            const historyLimit = activeLanguage === "en" ? 5 : 2;
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages
                        .filter((m) => m.id !== "init")
                        .slice(-historyLimit)
                        .map((m) => ({ role: m.role, text: m.text })),
                    language: activeLanguage,
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const aiText = data.message as string;

            setMessages((prev) => [
                ...prev,
                { id: (Date.now() + 1).toString(), role: "ai", text: aiText },
            ]);
        } catch {
            toast.error(getUIString(language, "chatError"));
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    text: getUIString(language, "chatError"),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="w-[350px] sm:w-[420px] h-[550px] bg-white/95 backdrop-blur-3xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-200/60 flex flex-col mb-4 overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between border-b border-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/20">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-extrabold tracking-tight text-white leading-tight">AgriTwin Agent</span>
                                  <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">Online</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 relative z-10">
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="h-8 bg-white/10 border-white/10 text-white hover:bg-white/20 transition-colors focus:ring-0 w-[110px] text-xs rounded-lg backdrop-blur-md">
                                        <Globe className="h-3 w-3 mr-1" />
                                        <SelectValue placeholder="Language" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[200]">
                                        {CHAT_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                {lang.nativeName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="text-white hover:bg-white/20 h-8 w-8 rounded-lg transition-colors ml-1"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 space-y-5">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn("flex max-w-[85%]", msg.role === "user" ? "ml-auto" : "mr-auto")}
                                >
                                    <div
                                        className={cn(
                                            "p-3.5 rounded-2xl text-[14px] leading-relaxed",
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm shadow-[0_4px_15px_rgba(16,185,129,0.25)]"
                                                : "bg-white border border-slate-200/60 text-slate-700 rounded-tl-sm shadow-[0_4px_15px_rgba(0,0,0,0.04)]"
                                        )}
                                    >
                                        {msg.role === "ai" ? (
                                            <div className="prose prose-sm prose-p:leading-relaxed prose-p:my-0">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex max-w-[85%] mr-auto">
                                    <div className="bg-white border border-slate-200/60 rounded-2xl rounded-tl-sm p-4 shadow-[0_4px_15px_rgba(0,0,0,0.04)] flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                        <span className="text-xs font-bold text-slate-400">Processing...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200/60 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2 bg-slate-100/80 rounded-2xl px-4 py-2 border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all shadow-inner">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSend();
                                    }}
                                    placeholder={
                                        language === "sw"
                                            ? "Uliza chochote..."
                                            : language === "kik"
                                              ? "Ũria ũndũ..."
                                              : "Ask your digital twin..."
                                    }
                                    className="flex-1 bg-transparent border-none text-[15px] focus:outline-none text-slate-800 placeholder:text-slate-400 py-1.5 font-medium"
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isLoading}
                                    size="icon"
                                    className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shrink-0 shadow-md shadow-emerald-500/20 transition-all"
                                >
                                    <Send className="h-4 w-4 ml-0.5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex items-center justify-center border border-white/20"
                >
                    <MessageSquare className="h-7 w-7" />
                </motion.button>
            )}
        </div>
    );
}
