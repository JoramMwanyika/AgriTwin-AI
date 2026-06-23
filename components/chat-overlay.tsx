"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, X, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { speakText, startSpeechRecognition } from "@/lib/speech";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CHAT_LANGUAGES, getUIString, normalizeLanguageCode } from "@/lib/languages";

export { CHAT_LANGUAGES as LANGUAGES };

interface Message {
    id: string;
    role: "ai" | "user";
    text: string;
}

export function ChatOverlay({
    isOpen,
    onClose,
    language,
    onLanguageChange,
}: {
    isOpen: boolean;
    onClose: () => void;
    language: string;
    onLanguageChange: (code: string) => void;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [lastAiText, setLastAiText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsRecording(false);
            setIsSpeaking(false);
            window.speechSynthesis?.cancel();
        }
    }, [isOpen]);

    const sendToAI = async (text: string) => {
        if (!text.trim() || isLoading) return;

        setIsLoading(true);
        setIsRecording(false);
        setLastAiText("");

        try {
            const activeLanguage = normalizeLanguageCode(language);
            const historyLimit = activeLanguage === "en" ? 5 : 2;
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        ...messages.slice(-historyLimit).map((m) => ({ role: m.role, text: m.text })),
                        { role: "user", text },
                    ],
                    language: activeLanguage,
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            const aiText = data.message as string;

            setMessages(prev => [
                ...prev,
                { id: Date.now().toString(), role: "user", text },
                { id: (Date.now() + 1).toString(), role: "ai", text: aiText },
            ]);

            setIsLoading(false);
            setIsSpeaking(true);
            setInputValue("");
            setLastAiText(aiText);

            await speakText(aiText, language);
            setIsSpeaking(false);

        } catch {
            toast.error(getUIString(language, "chatError"));
            setIsLoading(false);
        }
    };

    const recognitionRef = useRef<{ stop: () => void } | null>(null);

    const toggleRecording = async () => {
        if (isSpeaking) {
            toast.info(getUIString(language, "waitResponse"));
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            // The recognizer.recognized event handles calling sendToAI
        } else {
            setIsRecording(true);
            setInputValue("");
            setLastAiText("");

            const recognizer = await startSpeechRecognition(
                async (text) => {
                    setIsRecording(false);
                    if (text?.trim()) {
                        setInputValue(text);
                        await sendToAI(text);
                    } else {
                        toast.info(getUIString(language, "noSpeech"));
                    }
                },
                (error) => {
                    setIsRecording(false);
                    const msg = error || getUIString(language, "transcribeError");
                    toast.error(msg);
                },
                language
            );

            if (recognizer) {
                recognitionRef.current = recognizer;
            } else {
                setIsRecording(false);
                toast.error(getUIString(language, "micError"));
            }
        }
    };

    const displayText =
        lastAiText && (isSpeaking || (!isRecording && !isLoading && !inputValue))
            ? lastAiText
            : inputValue ||
              (isRecording
                  ? getUIString(language, "listening")
                  : getUIString(language, "tapToStart"));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/60 backdrop-blur-xl pointer-events-auto"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-3xl h-full max-h-[800px] relative z-10 flex flex-col pointer-events-none items-center justify-center"
                    >
                        <div className="absolute top-4 left-4 flex pointer-events-auto">
                            <div className="bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-sm flex items-center pr-2">
                                <div className="pl-4 pr-2 text-slate-500">
                                    <Globe className="h-4 w-4" />
                                </div>
                                <Select value={language} onValueChange={onLanguageChange}>
                                    <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent font-medium h-10 w-[160px]">
                                        <SelectValue placeholder="Language" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-200 z-[200]">
                                        {CHAT_LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code} className="cursor-pointer">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{lang.nativeName}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{lang.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 pointer-events-auto">
                            <Button variant="outline" size="icon" onClick={onClose} className="rounded-full bg-white/90 backdrop-blur-md border-slate-200 shadow-sm hover:bg-white text-slate-600 h-10 w-10">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="absolute top-32 w-full px-4 pointer-events-none flex justify-center">
                            <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-[20px] p-6 text-center border border-slate-100 max-w-lg w-full min-h-[120px] flex items-center justify-center transition-all duration-300 transform">
                                <p
                                    className={cn(
                                        "text-lg font-medium leading-relaxed transition-colors max-h-40 overflow-y-auto",
                                        !inputValue && !lastAiText && !isRecording
                                            ? "text-slate-400 italic"
                                            : isSpeaking
                                              ? "text-emerald-800"
                                              : "text-slate-800"
                                    )}
                                >
                                    {displayText}
                                </p>
                            </div>
                        </div>

                        <div className="relative mt-8 pointer-events-auto cursor-pointer group" onClick={toggleRecording}>
                            {isRecording && (
                                <>
                                    <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full border border-green-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75"></div>
                                    <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full border border-teal-300 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50"></div>
                                </>
                            )}

                            {isSpeaking && (
                                <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-green-500/10 animate-pulse"></div>
                            )}

                            <div
                                className={cn(
                                    "relative z-10 h-32 w-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
                                    isRecording
                                        ? "bg-slate-700 shadow-green-500/30 scale-105"
                                        : "bg-slate-800 hover:bg-slate-900 shadow-slate-900/40"
                                )}
                            >
                                <Mic className={cn("h-14 w-14 transition-colors", isRecording ? "text-green-400" : "text-white group-hover:text-green-300")} />
                            </div>
                        </div>

                        <div className="absolute bottom-32 w-full px-8 flex justify-center pointer-events-none">
                            <AnimatePresence>
                                {(isLoading || isSpeaking || isRecording) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="bg-white/95 backdrop-blur-md shadow-lg rounded-full px-6 py-3.5 border border-slate-100 flex items-center gap-3 pointer-events-auto"
                                    >
                                        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
                                        {isSpeaking && (
                                            <div className="flex gap-1 items-center justify-center h-5">
                                                <div className="w-1.5 rounded-full bg-green-500 h-2 animate-bounce" />
                                                <div className="w-1.5 rounded-full bg-green-500 h-4 animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <div className="w-1.5 rounded-full bg-green-500 h-3 animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        )}
                                        {isRecording && (
                                            <div className="flex items-center justify-center h-5 w-5">
                                                <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                                            </div>
                                        )}

                                        <span className="font-semibold text-slate-700 text-sm">
                                            {isLoading && getUIString(language, "processing")}
                                            {isSpeaking && getUIString(language, "responding")}
                                            {isRecording && getUIString(language, "listeningShort")}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
