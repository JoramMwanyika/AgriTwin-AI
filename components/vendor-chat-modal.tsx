"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Store, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type VendorMessage = {
    id: string;
    content: string;
    isFromUser: boolean;
    createdAt: string;
};

type VendorChatModalProps = {
    isOpen: boolean;
    onClose: () => void;
    vendorName: string;
};

export function VendorChatModal({ isOpen, onClose, vendorName }: VendorChatModalProps) {
    const [messages, setMessages] = useState<VendorMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && vendorName) {
            fetchMessages();
        }
    }, [isOpen, vendorName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Poll for new messages every 3 seconds while modal is open
    useEffect(() => {
        if (!isOpen || !vendorName) return;
        const interval = setInterval(() => {
            fetchMessages(false); // Silent fetch
        }, 3000);
        return () => clearInterval(interval);
    }, [isOpen, vendorName]);

    const fetchMessages = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const res = await fetch(`/api/market/vendor-chat?vendorName=${encodeURIComponent(vendorName)}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const optimisticMsg: VendorMessage = {
            id: Date.now().toString(),
            content: input,
            isFromUser: true,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setInput("");

        try {
            const res = await fetch("/api/market/vendor-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendorName, content: optimisticMsg.content })
            });

            if (!res.ok) {
                throw new Error("Failed to send message");
            }
            
            // Re-fetch after short delay to get the automated reply
            setTimeout(() => {
                fetchMessages(false);
            }, 1600);
            
        } catch (error) {
            console.error("Error sending message", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md h-[600px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">{vendorName}</h3>
                            <p className="text-xs font-medium text-emerald-600 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                Verified Vendor
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <Store className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium text-sm">Start a conversation with {vendorName}</p>
                            <p className="text-slate-400 text-xs mt-1">Ask about pricing, quantities, or pickup logistics.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className="flex max-w-[85%] gap-2 items-end">
                                        {!msg.isFromUser && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 mb-1">
                                                <Store className="w-3 h-3" />
                                            </div>
                                        )}
                                        <div className={`px-4 py-3 rounded-2xl text-sm ${
                                            msg.isFromUser 
                                            ? 'bg-emerald-600 text-white rounded-br-sm' 
                                            : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                        {msg.isFromUser && (
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 mb-1">
                                                <User className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                        className="flex items-center gap-2"
                    >
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <Button 
                            type="submit" 
                            disabled={!input.trim()}
                            className="rounded-full w-10 h-10 p-0 bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
