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
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col mb-4 overflow-hidden"
                    >
                        <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-green-400" />
                                </div>
                                <span className="font-bold">AgriTwin Agent</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="h-8 bg-transparent border-slate-600 text-slate-200 focus:ring-0 w-[110px] text-xs">
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
                                    className="text-slate-300 hover:text-white hover:bg-slate-700 h-8 w-8 rounded-full"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn("flex max-w-[85%]", msg.role === "user" ? "ml-auto" : "mr-auto")}
                                >
                                    <div
                                        className={cn(
                                            "p-3 rounded-2xl text-sm",
                                            msg.role === "user"
                                                ? "bg-green-500 text-white rounded-tr-sm"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
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
                                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-slate-200">
                            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-400 transition-all">
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
                                              : "Ask anything..."
                                    }
                                    className="flex-1 bg-transparent border-none text-sm focus:outline-none text-slate-700 placeholder:text-slate-400"
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isLoading}
                                    size="icon"
                                    className="h-8 w-8 rounded-lg bg-green-500 hover:bg-green-600 text-white shrink-0"
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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 bg-slate-800 hover:bg-slate-900 text-white rounded-full shadow-lg flex items-center justify-center border-2 border-white"
                >
                    <MessageSquare className="h-6 w-6" />
                </motion.button>
            )}
        </div>
    );
}
