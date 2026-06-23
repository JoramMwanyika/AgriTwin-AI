"use client";

import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertTriangle, Search, X, Globe } from "lucide-react";
import { useChat } from "@/components/chat-provider";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CHAT_LANGUAGES as LANGUAGES } from "@/lib/languages";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ScanPage() {
    const { toggleChat } = useChat();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [language, setLanguage] = useState("en");
    const [analysisResult, setAnalysisResult] = useState<{
        plantType: string;
        condition: string;
        severity: string;
        confidence: string;
        symptoms: string[];
        treatment: string;
    } | null>(null);

    const [scanHistory, setScanHistory] = useState<any[]>([]);

    const storageKey = session?.user?.email ? `agriTwin_scanHistory_${session.user.email}` : null;

    // Load from local storage
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    setScanHistory(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse scan history", e);
                }
            }
        }
    }, [storageKey]);

    // Save to local storage when updated
    useEffect(() => {
        if (storageKey && scanHistory.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(scanHistory));
        }
    }, [scanHistory, storageKey]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error("Image too large (max 10MB)");
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        setAnalysisResult(null);
        toast.info("Analyzing crop health...");

        const formData = new FormData();
        formData.append("image", selectedImage);
        formData.append("language", language);

        try {
            const response = await fetch("/api/analyze-image", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Failed to analyze");

            const data = await response.json();
            setAnalysisResult(data.analysis);
            toast.success("Analysis complete");

            // Add new scan to history
            const newHistoryItem = {
                id: Date.now(),
                plantType: data.analysis.plantType,
                severity: data.analysis?.severity?.toLowerCase() === 'healthy' ? 'healthy' : (data.analysis?.severity?.toLowerCase() === 'warning' ? 'warning' : 'critical'),
                condition: data.analysis.condition,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                img: imagePreview || "/community-farm.jpeg",
            };
            setScanHistory(prev => [newHistoryItem, ...prev]);

        } catch (error) {
            console.error("Analysis error:", error);
            toast.error("Failed to analyze image");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <AppShell>
            <div className="space-y-6">
                <AppPageHeader subtitle="AI Crop Health Scan" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Upload & Results (Span 8) */}
                    <div className="lg:col-span-8 space-y-6">

                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-lg">Upload an Image</h3>
                                <Select value={language} onValueChange={setLanguage}>
                                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 focus:ring-green-500 rounded-xl">
                                        <Globe className="h-4 w-4 mr-2 text-slate-500" />
                                        <SelectValue placeholder="Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map((lang: any) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                {lang.nativeName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {!imagePreview ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer group h-80"
                                >
                                    <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <UploadCloud className="h-10 w-10" />
                                    </div>
                                    <p className="font-bold text-slate-800 text-xl mb-2">Drag and drop or Browse</p>
                                    <p className="text-slate-500 font-medium">Clear photos of leaves or stems work best</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                                        <Image src={imagePreview} alt="Preview" layout="fill" objectFit="contain" />
                                        <button
                                            onClick={() => { setSelectedImage(null); setImagePreview(null); setAnalysisResult(null); }}
                                            className="absolute top-4 right-4 bg-red-500/90 text-white rounded-full p-2 backdrop-blur-sm hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {!analysisResult && !isAnalyzing && (
                                        <div className="flex justify-end gap-4">
                                            <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600" onClick={() => fileInputRef.current?.click()}>
                                                Change Photo
                                            </Button>
                                            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20" onClick={analyzeImage}>
                                                Analyze Crop Health
                                            </Button>
                                        </div>
                                    )}

                                    {isAnalyzing && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center space-y-4">
                                            <div className="h-12 w-12 border-4 border-slate-200 border-t-green-500 rounded-full animate-spin" />
                                            <p className="font-medium text-slate-600">AgriTwin AI is analyzing the image...</p>
                                        </div>
                                    )}

                                    {analysisResult && (
                                        <div className={`rounded-xl p-6 border shadow-sm ${analysisResult?.severity?.toLowerCase() === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                            <h4 className="font-bold text-lg mb-4 text-slate-800">Scan Results</h4>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                    <p className="text-xs text-slate-500 font-medium mb-1">Plant Type</p>
                                                    <p className="font-bold text-slate-800 capitalize">{analysisResult.plantType}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                    <p className="text-xs text-slate-500 font-medium mb-1">Condition</p>
                                                    <p className="font-bold text-slate-800">{analysisResult.condition}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                    <p className="text-xs text-slate-500 font-medium mb-1">Severity</p>
                                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${analysisResult.severity.toLowerCase() === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <span className="capitalize">{analysisResult.severity}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                    <p className="text-xs text-slate-500 font-medium mb-1">Confidence</p>
                                                    <p className="font-bold text-slate-800">{analysisResult.confidence}</p>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm mb-4">
                                                <p className="text-xs text-slate-500 font-medium mb-2">Detected Symptoms</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysisResult.symptoms.map((sym, i) => (
                                                        <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200">{sym}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm mb-4">
                                                <p className="text-xs text-slate-500 font-medium mb-2">Algorithm Recommended Action</p>
                                                <p className="text-sm text-slate-700 font-medium bg-blue-50/50 p-3 rounded-md border border-blue-100">
                                                    {analysisResult.treatment}
                                                </p>
                                            </div>

                                            <div className="flex justify-end gap-4 mt-6 border-t border-slate-200/50 pt-4">
                                                <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 bg-white" onClick={() => { setSelectedImage(null); setImagePreview(null); setAnalysisResult(null); }}>
                                                    Scan Another
                                                </Button>
                                                <Button className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-6" onClick={toggleChat}>
                                                    Ask AgriTwin for Treatment
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Scan History (Span 4) */}
                    <div className="lg:col-span-4 space-y-6">

                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-800 text-lg">Scan History</h3>
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>

                            {scanHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {scanHistory.map((scan) => (
                                        <div key={scan.id} className="flex gap-4 p-3 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-slate-50 cursor-pointer relative group">
                                            <div className="h-20 w-24 bg-slate-200 rounded-lg overflow-hidden relative shrink-0">
                                                <Image src={scan.img} alt="Scan" layout="fill" objectFit="cover" />
                                                {scan.severity === 'critical' && <div className="absolute inset-0 bg-red-500/10" />}
                                                {scan.severity === 'warning' && <div className="absolute inset-0 bg-yellow-500/10" />}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <h4 className="font-bold text-slate-800 text-sm capitalize">{scan.plantType}</h4>
                                                <p className={`font-bold text-sm mb-1 flex items-center gap-1 ${scan.severity === 'healthy' ? 'text-green-500' :
                                                    scan.severity === 'warning' ? 'text-yellow-600' : 'text-red-500'
                                                    }`}>
                                                    {scan.severity === 'healthy' ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                                    {scan.condition}
                                                </p>
                                                <p className="text-slate-500 text-xs font-medium">{scan.date}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setScanHistory(prev => prev.filter(s => s.id !== scan.id));
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm"
                                                title="Delete scan"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm font-medium">No scans yet</p>
                                    <p className="text-slate-400 text-xs mt-1">Upload a crop image to start tracking history.</p>
                                </div>
                            )}

                            {scanHistory.length > 0 && (
                                <button
                                    onClick={() => {
                                        setScanHistory([]);
                                        if (storageKey) localStorage.removeItem(storageKey);
                                    }}
                                    className="w-full mt-6 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors text-sm"
                                >
                                    Clear All History
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </AppShell>
    );
}
