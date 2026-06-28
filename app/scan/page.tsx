"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import {
    UploadCloud, Image as ImageIcon, CheckCircle, AlertTriangle,
    X, Globe, Camera, CameraOff, ScanSearch, RotateCcw,
    Sparkles, Leaf, ShieldAlert, BadgeCheck, Loader2, Trash2
} from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AnalysisResult = {
    plantType: string;
    condition: string;
    severity: string;
    confidence: string;
    symptoms: string[];
    treatment: string;
};

type ScanHistoryItem = {
    id: number;
    plantType: string;
    severity: string;
    condition: string;
    date: string;
    img: string;
};

export default function ScanPage() {
    const { toggleChat } = useChat();
    const { data: session } = useSession();
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [language, setLanguage] = useState("en");
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const triggerVoiceWidget = () => {
        const widget = document.querySelector("elevenlabs-convai");
        if (widget && widget.shadowRoot) {
            const btn = widget.shadowRoot.querySelector("button");
            if (btn) { btn.click(); return; }
        }
        toggleChat();
    };

    const storageKey = session?.user?.email ? `agriTwin_scanHistory_${session.user.email}` : null;

    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try { setScanHistory(JSON.parse(saved)); } catch { }
            }
        }
    }, [storageKey]);

    useEffect(() => {
        if (storageKey && scanHistory.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(scanHistory));
        }
    }, [scanHistory, storageKey]);

    // Camera cleanup on unmount
    useEffect(() => {
        return () => {
            cameraStream?.getTracks().forEach(t => t.stop());
        };
    }, [cameraStream]);

    const startCamera = async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            setCameraStream(stream);
            setIsCameraMode(true);
            setImagePreview(null);
            setSelectedImage(null);
            setAnalysisResult(null);
        } catch (err) {
            setCameraError("Camera access denied or not available.");
            toast.error("Cannot access camera. Check browser permissions.");
        }
    };

    useEffect(() => {
        if (isCameraMode && videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
            videoRef.current.play().catch(() => { });
        }
    }, [isCameraMode, cameraStream]);

    const stopCamera = useCallback(() => {
        cameraStream?.getTracks().forEach(t => t.stop());
        setCameraStream(null);
        setIsCameraMode(false);
    }, [cameraStream]);

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
            const url = URL.createObjectURL(blob);
            setSelectedImage(file);
            setImagePreview(url);
            stopCamera();
        }, "image/jpeg", 0.95);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { toast.error("Image too large (max 10MB)"); return; }
            setSelectedImage(file);
            setAnalysisResult(null);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setAnalysisResult(null);
        stopCamera();
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
            const response = await fetch("/api/analyze-image", { method: "POST", body: formData });
            if (!response.ok) throw new Error("Failed to analyze");
            const data = await response.json();
            setAnalysisResult(data.analysis);
            toast.success("Analysis complete!");
            const newItem: ScanHistoryItem = {
                id: Date.now(),
                plantType: data.analysis.plantType,
                severity: data.analysis?.severity?.toLowerCase() === "healthy" ? "healthy" :
                    data.analysis?.severity?.toLowerCase() === "warning" ? "warning" : "critical",
                condition: data.analysis.condition,
                date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                img: imagePreview || "/community-farm.jpeg",
            };
            setScanHistory(prev => [newItem, ...prev]);
        } catch {
            toast.error("Failed to analyze image");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const isHealthy = analysisResult?.severity?.toLowerCase() === "healthy";

    return (
        <AppShell>
            <div className="space-y-6">
                <AppPageHeader subtitle="AI Crop Health Scan" />

                {/* MAIN SCAN AREA */}
                <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <ScanSearch className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-900 text-base tracking-tight">Crop Scanner</h2>
                                <p className="text-xs text-slate-400 font-medium">Upload or capture a photo to diagnose</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="h-9 bg-slate-50 border-slate-200 focus:ring-emerald-500 rounded-xl w-[140px] text-xs font-semibold">
                                    <Globe className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                    <SelectValue placeholder="Language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((lang: any) => (
                                        <SelectItem key={lang.code} value={lang.code}>{lang.nativeName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SCAN CONTENT */}
                    <div className={cn("grid gap-0", imagePreview && analysisResult ? "lg:grid-cols-2" : "grid-cols-1")}>

                        {/* LEFT: IMAGE PANEL */}
                        <div className="relative bg-slate-950 min-h-[480px] flex flex-col">
                            <AnimatePresence mode="wait">
                                {/* Camera Mode */}
                                {isCameraMode ? (
                                    <motion.div
                                        key="camera"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative flex-1 flex flex-col"
                                    >
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover min-h-[480px]"
                                        />
                                        {/* Camera overlay UI */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Corner guides */}
                                            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-emerald-400 rounded-tl-md" />
                                            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-emerald-400 rounded-tr-md" />
                                            <div className="absolute bottom-28 left-8 w-12 h-12 border-b-2 border-l-2 border-emerald-400 rounded-bl-md" />
                                            <div className="absolute bottom-28 right-8 w-12 h-12 border-b-2 border-r-2 border-emerald-400 rounded-br-md" />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-6 bg-gradient-to-t from-black/70 to-transparent">
                                            <button
                                                onClick={stopCamera}
                                                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-red-500/40 transition-colors"
                                            >
                                                <CameraOff className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={capturePhoto}
                                                className="h-20 w-20 rounded-full bg-white border-4 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center hover:scale-105 transition-transform"
                                            >
                                                <Camera className="h-8 w-8 text-slate-800" />
                                            </button>
                                            <div className="h-12 w-12" /> {/* spacer */}
                                        </div>
                                    </motion.div>
                                ) : imagePreview ? (
                                    /* Image Preview — covers full panel */
                                    <motion.div
                                        key="preview"
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="relative flex-1 min-h-[480px]"
                                    >
                                        <Image
                                            src={imagePreview}
                                            alt="Crop Preview"
                                            fill
                                            className="object-fill"
                                            unoptimized
                                        />
                                        {/* Top controls */}
                                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                            <div className="bg-black/40 backdrop-blur-md rounded-xl px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1.5">
                                                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                                                Ready to analyze
                                            </div>
                                            <button
                                                onClick={handleReset}
                                                className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-red-500/60 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {/* Bottom action */}
                                        {!analysisResult && !isAnalyzing && (
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition-colors"
                                                >
                                                    Change Photo
                                                </button>
                                                <button
                                                    onClick={analyzeImage}
                                                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-black shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 flex items-center gap-2"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    Analyze Crop Health
                                                </button>
                                            </div>
                                        )}
                                        {/* Analyzing overlay */}
                                        {isAnalyzing && (
                                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                                                <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-white font-black text-lg">Analyzing...</p>
                                                    <p className="text-white/60 text-sm font-medium mt-1">AgriTwin AI is examining your crop</p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    /* Upload Prompt */
                                    <motion.div
                                        key="upload"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex-1 flex flex-col items-center justify-center p-8 min-h-[480px]"
                                    >
                                        <div className="text-center max-w-sm">
                                            <div className="h-24 w-24 mx-auto mb-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                <ScanSearch className="h-12 w-12 text-emerald-400" />
                                            </div>
                                            <h3 className="text-white font-black text-2xl mb-2 tracking-tight">Scan Your Crop</h3>
                                            <p className="text-slate-400 text-sm font-medium mb-8">
                                                Upload a clear photo of leaves or stems for instant AI-powered disease detection
                                            </p>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
                                                >
                                                    <UploadCloud className="h-5 w-5" />
                                                    Upload Photo
                                                </button>
                                                <button
                                                    onClick={startCamera}
                                                    className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
                                                >
                                                    <Camera className="h-5 w-5 text-emerald-400" />
                                                    Use Camera
                                                </button>
                                            </div>
                                            {cameraError && (
                                                <p className="mt-4 text-red-400 text-xs font-medium">{cameraError}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* RIGHT: ANALYSIS RESULTS PANEL */}
                        <AnimatePresence>
                            {analysisResult && (
                                <motion.div
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 30 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="flex flex-col bg-white min-h-[480px] overflow-y-auto"
                                >
                                    {/* Result Header */}
                                    <div className={cn(
                                        "p-5 border-b",
                                        isHealthy ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"
                                    )}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center",
                                                isHealthy ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                            )}>
                                                {isHealthy ? <BadgeCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Diagnosis</p>
                                                <h3 className="font-black text-slate-900 text-lg tracking-tight capitalize">{analysisResult.plantType}</h3>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border",
                                            isHealthy
                                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                : "bg-red-100 text-red-700 border-red-200"
                                        )}>
                                            <span className={cn("h-2 w-2 rounded-full", isHealthy ? "bg-emerald-500" : "bg-red-500")} />
                                            {analysisResult.severity}
                                        </span>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="p-5 grid grid-cols-2 gap-3 border-b border-slate-100">
                                        {[
                                            { label: "Condition", value: analysisResult.condition },
                                            { label: "Confidence", value: analysisResult.confidence },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                                                <p className="font-black text-slate-900 text-sm leading-tight">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Symptoms */}
                                    <div className="p-5 border-b border-slate-100">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Detected Symptoms</p>
                                        <div className="flex flex-wrap gap-2">
                                            {analysisResult.symptoms.map((sym, i) => (
                                                <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                    {sym}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Treatment */}
                                    <div className="p-5 flex-1">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Recommended Action</p>
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                            {analysisResult.treatment}
                                        </p>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-5 border-t border-slate-100 flex gap-3">
                                        <button
                                            onClick={handleReset}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-bold"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Scan Another
                                        </button>
                                        <button
                                            onClick={triggerVoiceWidget}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors text-sm font-bold shadow-md"
                                        >
                                            <Sparkles className="h-4 w-4 text-emerald-400" />
                                            Ask AgriTwin
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* SCAN HISTORY */}
                <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                            <h3 className="font-black text-slate-900 text-base tracking-tight">Scan History</h3>
                            {scanHistory.length > 0 && (
                                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-black">
                                    {scanHistory.length}
                                </span>
                            )}
                        </div>
                        {scanHistory.length > 0 && (
                            <button
                                onClick={() => { setScanHistory([]); if (storageKey) localStorage.removeItem(storageKey); }}
                                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear All
                            </button>
                        )}
                    </div>

                    {scanHistory.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {scanHistory.map((scan) => (
                                <motion.div
                                    key={scan.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="group relative bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-32 w-full bg-slate-200">
                                        <Image
                                            src={scan.img}
                                            alt="Scan"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className={cn(
                                            "absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-sm",
                                            scan.severity === "healthy"
                                                ? "bg-emerald-100/90 text-emerald-700 border-emerald-200"
                                                : scan.severity === "warning"
                                                    ? "bg-amber-100/90 text-amber-700 border-amber-200"
                                                    : "bg-red-100/90 text-red-700 border-red-200"
                                        )}>
                                            {scan.severity === "healthy"
                                                ? <CheckCircle className="h-2.5 w-2.5" />
                                                : <AlertTriangle className="h-2.5 w-2.5" />}
                                            {scan.severity}
                                        </div>
                                    </div>
                                    {/* Info */}
                                    <div className="p-3">
                                        <p className="font-black text-slate-900 text-sm capitalize truncate">{scan.plantType}</p>
                                        <p className="text-slate-500 text-xs font-medium truncate">{scan.condition}</p>
                                        <p className="text-slate-400 text-xs mt-1">{scan.date}</p>
                                    </div>
                                    {/* Delete button */}
                                    <button
                                        onClick={() => setScanHistory(prev => prev.filter(s => s.id !== scan.id))}
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                <ScanSearch className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-slate-500 text-sm font-bold">No scans yet</p>
                            <p className="text-slate-400 text-xs mt-1">Upload or capture a crop photo to start tracking</p>
                        </div>
                    )}
                </div>

                {/* Hidden inputs */}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </AppShell>
    );
}
