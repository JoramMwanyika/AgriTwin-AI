"use client";

import { useState } from "react";
import { CheckCircle, Circle, Plus, AlertTriangle, UploadCloud, MapPin, Search } from "lucide-react";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import Link from "next/link";

export default function TasksPage() {
    const [tasks, setTasks] = useState([
        { id: 1, title: "Fertilize Tomatoes", block: "Block B", time: "Pending", completed: false },
        { id: 2, title: "Water Maize", block: "Block A", time: "Pending", completed: false },
        { id: 3, title: "Check Bean Fungal Spots", block: "Block C", time: "Pending", completed: false },
    ]);

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <AppShell>
            <div className="space-y-6">
                <AppPageHeader subtitle="Your Tasks & Scans" />

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="h-11 w-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <span className="text-slate-600 font-medium text-sm">Farm Health: </span>
                            <span className="text-emerald-600 font-bold text-2xl">78% </span>
                            <span className="text-emerald-600 font-semibold text-sm">Good</span>
                        </div>
                    </div>
                    <div className="bg-red-50/80 border border-red-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                        <div className="h-11 w-11 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">
                            <span className="text-red-600 font-bold">Alert:</span> Block B - Low Moisture
                        </p>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 pb-4 border-b border-slate-100">
                            Daily / Upcoming Tasks
                        </h3>
                        <ul className="space-y-2 mb-6">
                            {tasks.map(task => (
                                <li
                                    key={task.id}
                                    className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    {task.completed ? (
                                        <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
                                    ) : (
                                        <Circle className="h-6 w-6 text-slate-300 shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <h4 className={`font-bold ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                                                <MapPin className="h-3 w-3" /> {task.block}
                                            </span>
                                            <span>{task.time}</span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            New Task
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm text-center">
                            <h3 className="font-bold text-slate-800 text-lg mb-4 text-left">Upload Crop Photo</h3>
                            <Link
                                href="/scan"
                                className="border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors rounded-xl p-8 flex flex-col items-center justify-center group"
                            >
                                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                                    <UploadCloud className="h-8 w-8" />
                                </div>
                                <p className="font-bold text-slate-700">Drag and drop or Browse</p>
                                <p className="text-slate-500 text-sm mt-1">To scan for diseases or pests</p>
                            </Link>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 text-lg">Recent Scans</h3>
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <div className="space-y-3">
                                {[
                                    { crop: "Beans", risk: "Fungal Risk (72%)", riskClass: "text-red-600", when: "Today • Block C" },
                                    { crop: "Tomatoes", risk: "Healthy", riskClass: "text-emerald-600", when: "Yesterday • Block A" },
                                ].map((scan) => (
                                    <div key={scan.crop} className="flex gap-4 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                        <div className="h-20 w-24 rounded-lg overflow-hidden relative shrink-0 border border-slate-200">
                                            <Image src="/community-farm.jpeg" alt={scan.crop} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h4 className="font-bold text-slate-800">{scan.crop}</h4>
                                            <p className={`font-bold text-sm mb-1 ${scan.riskClass}`}>{scan.risk}</p>
                                            <p className="text-slate-500 text-xs">{scan.when}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/scan"
                                className="block w-full mt-4 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition-colors"
                            >
                                View All Scan History
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
