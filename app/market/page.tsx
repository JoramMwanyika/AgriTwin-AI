"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TrendingUp, TrendingDown, Store, ShoppingCart, MapPin, User, Activity, Network, MessageSquare, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateListingModal } from "@/components/create-listing-modal";
import { VendorChatModal } from "@/components/vendor-chat-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type MarketData = {
    id: string;
    crop: string;
    location: string;
    price: number;
    change: number;
    trend: "up" | "down";
};

type PriceHistory = Record<string, { time: number; price: number }[]>;

const FADE_UP_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function MarketPage() {
    const { data: session } = useSession();
    const [isListingModalOpen, setIsListingModalOpen] = useState(false);
    const [listings, setListings] = useState<any[]>([]);
    const [loadingListings, setLoadingListings] = useState(false);
    
    // Vendor Network State
    const [vendors, setVendors] = useState<any[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [chatVendor, setChatVendor] = useState<string | null>(null);

    // Live Market State
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [priceHistory, setPriceHistory] = useState<PriceHistory>({});

    const fetchListings = async () => {
        setLoadingListings(true);
        try {
            const res = await fetch("/api/market/listings");
            if (res.ok) {
                const data = await res.json();
                setListings(data);
            }
        } catch (error) {
            console.error("Failed to load listings", error);
        } finally {
            setLoadingListings(false);
        }
    };

    const fetchLivePrices = async () => {
        try {
            const res = await fetch("/api/market/live");
            if (res.ok) {
                const data: MarketData[] = await res.json();
                setMarketData(data);
                
                // Update history for sparklines
                setPriceHistory(prev => {
                    const newHistory = { ...prev };
                    const now = Date.now();
                    data.forEach(item => {
                        if (!newHistory[item.id]) {
                            // Seed initial history
                            newHistory[item.id] = Array(10).fill(0).map((_, i) => ({
                                time: now - (10 - i) * 3000,
                                price: item.price
                            }));
                        }
                        newHistory[item.id] = [...newHistory[item.id].slice(-14), { time: now, price: item.price }];
                    });
                    return newHistory;
                });
            }
        } catch (err) {
            console.error("Failed to fetch live prices", err);
        }
    };

    const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
            const res = await fetch("/api/market/vendors");
            if (res.ok) {
                setVendors(await res.json());
            }
        } catch (error) {
            console.error("Failed to load vendors", error);
        } finally {
            setLoadingVendors(false);
        }
    };

    useEffect(() => {
        fetchListings();
        fetchLivePrices(); // Initial fetch
        fetchVendors();
        
        // Poll every 3 seconds for live ticker effect
        const interval = setInterval(fetchLivePrices, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <AppShell>
            <div className="space-y-8 pb-10">
                <AppPageHeader 
                    title="Agricultural Market" 
                    subtitle="Live commodity prices and peer-to-peer trading hub."
                />

                <Tabs defaultValue="prices" className="w-full">
                <div className="flex justify-center w-full mb-10 sticky top-[80px] z-10">
                    <TabsList className="inline-flex items-center justify-center bg-white/70 backdrop-blur-xl border border-slate-200 p-1.5 rounded-full shadow-sm">
                        <TabsTrigger value="prices" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 rounded-full px-6 py-2.5 font-bold transition-all text-sm flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Live Prices
                        </TabsTrigger>
                        <TabsTrigger value="trading" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 rounded-full px-6 py-2.5 font-bold transition-all text-sm flex items-center">
                            <Store className="w-4 h-4 mr-2" />
                            Peer Trading
                        </TabsTrigger>
                        <TabsTrigger value="network" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 rounded-full px-6 py-2.5 font-bold transition-all text-sm flex items-center">
                            <Network className="w-4 h-4 mr-2" />
                            Vendor Match
                        </TabsTrigger>
                    </TabsList>
                </div>

                    {/* === TAB 1: PREMIUM LIVE PRICES === */}
                    <TabsContent value="prices" className="focus-visible:outline-none placeholder:outline-none">
                        <motion.div 
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: { staggerChildren: 0.08 }
                                }
                            }}
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {marketData.length === 0 ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white animate-pulse h-48 rounded-[24px] border border-slate-100 shadow-sm"></div>
                                ))
                            ) : (
                                marketData.map((item) => {
                                    const isUp = item.trend === 'up';
                                    const history = priceHistory[item.id] || [];
                                    const minPrice = Math.min(...history.map(h => h.price));
                                    const maxPrice = Math.max(...history.map(h => h.price));

                                    return (
                                        <motion.div 
                                            variants={FADE_UP_ANIMATION_VARIANTS}
                                            key={item.id} 
                                            className="relative bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300"
                                        >
                                            {/* Background Gradient Blob */}
                                            <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-[0.15] transition-colors duration-500 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            
                                            <div className="relative z-10 flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-slate-400 font-bold text-[10px] mb-1.5 uppercase tracking-widest flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" /> {item.location}
                                                    </h3>
                                                    <p className="text-slate-800 font-extrabold text-xl">{item.crop}</p>
                                                </div>
                                                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors duration-300 ${isUp ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100' : 'bg-red-50/50 text-red-700 border-red-100'}`}>
                                                    {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {item.change > 0 ? '+' : ''}{item.change}
                                                </div>
                                            </div>
                                            
                                            <div className="relative z-10 flex items-end justify-between mb-2">
                                                <div>
                                                    <p className="text-slate-400 text-xs font-medium mb-1">Current Price (KES)</p>
                                                    <p className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums transition-all duration-300 flex items-baseline">
                                                        {item.price.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sparkline Chart */}
                                            <div className="h-14 w-full mt-4 -mx-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={history}>
                                                        <YAxis domain={[minPrice - (isUp ? 200 : 50), maxPrice + (isUp ? 50 : 200)]} hide />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="price" 
                                                            stroke={isUp ? "#059669" : "#dc2626"} 
                                                            strokeWidth={3} 
                                                            dot={false}
                                                            isAnimationActive={false} 
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </motion.div>
                    </TabsContent>


                    {/* === TAB 2: FARMER TRADING === */}
                    <TabsContent value="trading" className="focus-visible:outline-none placeholder:outline-none">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-teal-800 to-teal-950 text-white p-8 md:p-10 rounded-[32px] shadow-xl relative overflow-hidden mb-8"
                        >
                            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-400 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 mix-blend-overlay"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600 rounded-full blur-3xl opacity-20 -ml-20 -mb-20 mix-blend-overlay"></div>
                            
                            <div className="relative z-10 mb-6 md:mb-0">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/50 border border-teal-700/50 text-teal-200 text-xs font-bold mb-4 backdrop-blur-sm">
                                    <Sparkles className="w-3.5 h-3.5" /> Peer-to-Peer
                                </div>
                                <h3 className="font-black text-3xl mb-3 tracking-tight">Direct Farmer Trading</h3>
                                <p className="text-teal-100/90 font-medium max-w-lg leading-relaxed text-sm">Bypass middlemen. Buy and sell agricultural produce directly with other verified farmers in your region.</p>
                            </div>
                            <button onClick={() => setIsListingModalOpen(true)} className="relative z-10 bg-white text-teal-950 hover:bg-teal-50 font-extrabold py-4 px-8 rounded-2xl flex items-center shadow-2xl hover:-translate-y-1 hover:shadow-teal-900/30 transition-all duration-300">
                                <Store className="w-5 h-5 mr-2" />
                                Create Listing
                            </button>
                        </motion.div>

                        {loadingListings ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="h-10 w-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
                            </div>
                        ) : listings.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm"
                            >
                                <div className="bg-slate-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                    <ShoppingCart className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-2xl mb-2 tracking-tight">No listings found</h3>
                                <p className="text-slate-500 mb-8 font-medium">Be the first to list your harvest to the network!</p>
                                <Button onClick={() => setIsListingModalOpen(true)} className="bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl px-8 py-6 shadow-lg shadow-slate-900/10">
                                    Start Selling
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial="hidden"
                                animate="show"
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1 }
                                    }
                                }}
                                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                            >
                                {listings.map((listing) => (
                                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} key={listing.id} className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                                        {listing.imageUrl ? (
                                            <div className="relative h-60 w-full bg-slate-100 overflow-hidden">
                                                <Image
                                                    src={listing.imageUrl}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-slate-900/0" />
                                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-teal-800 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm flex items-center">
                                                    {listing.quantity}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-60 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-300 relative border-b border-slate-100">
                                                <Store className="w-16 h-16 opacity-20" />
                                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md text-teal-800 px-3.5 py-1.5 rounded-full text-xs font-black shadow-sm">
                                                    {listing.quantity}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-7 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 leading-none">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {listing.location}
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1 tracking-tight group-hover:text-teal-700 transition-colors">{listing.title}</h3>
                                            
                                            <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">
                                                {listing.description}
                                            </p>

                                            <div className="space-y-6 mt-auto">
                                                <div className="flex items-end justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-400 mb-0.5">Price</span>
                                                        <div className="text-slate-900 font-black text-2xl tracking-tight flex items-baseline">
                                                            <span className="text-sm text-slate-500 mr-1 font-bold">KES</span>
                                                            {listing.price.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center overflow-hidden border border-teal-100 shadow-sm">
                                                            {listing.seller?.image ? (
                                                                <Image src={listing.seller.image} alt={listing.seller.name || "User"} width={40} height={40} className="object-cover" />
                                                            ) : (
                                                                <User className="w-4 h-4 text-teal-600" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800 truncate max-w-[110px] leading-tight">
                                                                {listing.seller?.name || "Verified Farmer"}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider">Seller</span>
                                                        </div>
                                                    </div>
                                                    <Button className="rounded-xl px-4 py-5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold border border-teal-200/50 shadow-sm transition-all group/btn" onClick={() => toast.success(`Contacting ${listing.seller?.name || 'Seller'}...`)}>
                                                        Contact <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </TabsContent>

                    {/* === TAB 3: VENDOR NETWORK === */}
                    <TabsContent value="network" className="focus-visible:outline-none placeholder:outline-none">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 md:p-10 rounded-[32px] shadow-xl relative overflow-hidden mb-8"
                        >
                            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 mix-blend-overlay"></div>
                            
                            <div className="relative z-10 mb-6 md:mb-0">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-800/50 border border-indigo-700/50 text-indigo-200 text-xs font-bold mb-4 backdrop-blur-sm">
                                    <Network className="w-3.5 h-3.5" /> Graph Search
                                </div>
                                <h3 className="font-black text-3xl mb-3 tracking-tight">Vendor Match Network</h3>
                                <p className="text-indigo-100/90 font-medium max-w-lg leading-relaxed text-sm">Powered by our Neo4j Knowledge Graph. Find buyers and distributors physically close to you or connected in the supply chain.</p>
                            </div>
                        </motion.div>

                        {loadingVendors ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            </div>
                        ) : vendors.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm"
                            >
                                <div className="bg-slate-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                                    <Network className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-2xl mb-2 tracking-tight">No vendors found</h3>
                                <p className="text-slate-500 mb-8 font-medium">Make sure the Neo4j database is seeded.</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial="hidden"
                                animate="show"
                                variants={{
                                    hidden: { opacity: 0 },
                                    show: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1 }
                                    }
                                }}
                                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                            >
                                {vendors.map((vendor, idx) => (
                                    <motion.div variants={FADE_UP_ANIMATION_VARIANTS} key={idx} className="bg-white rounded-[28px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex flex-col p-7 group">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                <Store className="w-7 h-7" />
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-full border ${vendor.type === 'Buyer' ? 'bg-orange-50/80 text-orange-700 border-orange-200' : 'bg-blue-50/80 text-blue-700 border-blue-200'} shadow-sm`}>
                                                {vendor.type}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-slate-900 mb-1.5 group-hover:text-indigo-700 transition-colors tracking-tight">{vendor.name}</h3>
                                        
                                        <div className="space-y-3 mt-4 mb-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                            <div className="flex items-center text-slate-500 font-medium text-sm">
                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm mr-3">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <strong className="text-slate-800">{vendor.location}</strong>
                                            </div>
                                            <div className="flex items-center text-slate-500 font-medium text-sm">
                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm mr-3">
                                                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <strong className="text-slate-800">{vendor.scale}</strong>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-auto pt-6">
                                            <Button 
                                                onClick={() => setChatVendor(vendor.name)}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 font-bold shadow-lg shadow-slate-900/10 group-hover:bg-indigo-600 transition-colors"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                Chat with Vendor
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <CreateListingModal
                isOpen={isListingModalOpen}
                onClose={() => setIsListingModalOpen(false)}
                onSuccess={fetchListings}
            />

            <VendorChatModal 
                isOpen={!!chatVendor}
                onClose={() => setChatVendor(null)}
                vendorName={chatVendor || ""}
            />
        </AppShell>
    );
}
