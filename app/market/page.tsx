"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TrendingUp, TrendingDown, Store, ShoppingCart, MapPin, User, Activity, Network, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateListingModal } from "@/components/create-listing-modal";
import { VendorChatModal } from "@/components/vendor-chat-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Image from "next/image";
import { AppShell } from "@/components/app-shell";
import { AppPageHeader } from "@/components/app-page-header";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

type MarketData = {
    id: string;
    crop: string;
    location: string;
    price: number;
    change: number;
    trend: "up" | "down";
};

type PriceHistory = Record<string, { time: number; price: number }[]>;

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
            <div className="space-y-6">
                <AppPageHeader 
                    title="Agricultural Market" 
                    subtitle="Live commodity prices and peer-to-peer trading" 
                />

                <Tabs defaultValue="prices" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/40 backdrop-blur-md border border-slate-200/50 p-1 rounded-2xl shadow-sm">
                        <TabsTrigger value="prices" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 text-slate-500 rounded-xl py-3 font-bold shadow-sm transition-all">
                            <Activity className="w-4 h-4 mr-2" />
                            Live Prices
                        </TabsTrigger>
                        <TabsTrigger value="trading" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 text-slate-500 rounded-xl py-3 font-bold shadow-sm transition-all">
                            <Store className="w-4 h-4 mr-2" />
                            Farmer Trading
                        </TabsTrigger>
                        <TabsTrigger value="network" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 text-slate-500 rounded-xl py-3 font-bold shadow-sm transition-all">
                            <Network className="w-4 h-4 mr-2" />
                            Vendor Network
                        </TabsTrigger>
                    </TabsList>

                    {/* === TAB 1: PREMIUM LIVE PRICES === */}
                    <TabsContent value="prices" className="space-y-6 mt-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {marketData.length === 0 ? (
                                Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="bg-white/50 animate-pulse h-48 rounded-[24px] border border-white/60"></div>
                                ))
                            ) : (
                                marketData.map((item) => {
                                    const isUp = item.trend === 'up';
                                    const history = priceHistory[item.id] || [];
                                    const minPrice = Math.min(...history.map(h => h.price));
                                    const maxPrice = Math.max(...history.map(h => h.price));

                                    return (
                                        <div key={item.id} className="relative bg-white/60 backdrop-blur-xl rounded-[24px] p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                                            {/* Background Gradient Blob */}
                                            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${isUp ? 'bg-green-500' : 'bg-red-500'}`} />
                                            
                                            <div className="relative z-10 flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-slate-500 font-bold text-xs mb-1 uppercase tracking-wider flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" /> {item.location}
                                                    </h3>
                                                    <p className="text-slate-800 font-extrabold text-xl">{item.crop}</p>
                                                </div>
                                                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors duration-300 ${isUp ? 'bg-green-100/80 text-green-700' : 'bg-red-100/80 text-red-700'}`}>
                                                    {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {item.change > 0 ? '+' : ''}{item.change}
                                                </div>
                                            </div>
                                            
                                            <div className="relative z-10 flex items-end justify-between mb-4">
                                                <div>
                                                    <p className="text-slate-500 text-xs font-medium mb-1">Current Price</p>
                                                    <p className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums transition-all duration-300">
                                                        <span className="text-lg text-slate-400 font-bold mr-1">KES</span>
                                                        {item.price.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sparkline Chart */}
                                            <div className="h-16 w-full mt-2 -mx-2">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={history}>
                                                        <YAxis domain={[minPrice - 100, maxPrice + 100]} hide />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey="price" 
                                                            stroke={isUp ? "#10b981" : "#ef4444"} 
                                                            strokeWidth={3} 
                                                            dot={false}
                                                            isAnimationActive={false} // Disable to make it look like a live ticker stream
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </TabsContent>


                    {/* === TAB 2: FARMER TRADING === */}
                    <TabsContent value="trading" className="space-y-6 mt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-emerald-900 text-white p-8 rounded-[24px] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                            <div className="relative z-10 mb-6 md:mb-0">
                                <h3 className="font-black text-2xl mb-2">Direct Farmer Trading</h3>
                                <p className="text-emerald-100/80 font-medium max-w-md">Bypass middlemen. Buy and sell agricultural produce directly with other verified farmers in your region.</p>
                            </div>
                            <button onClick={() => setIsListingModalOpen(true)} className="relative z-10 bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold py-3.5 px-6 rounded-xl flex items-center shadow-xl transition-all">
                                <Store className="w-5 h-5 mr-2" />
                                Create Listing
                            </button>
                        </div>

                        {loadingListings ? (
                            <div className="text-center py-20 text-slate-500 font-medium">
                                <div className="h-8 w-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                                Loading listings...
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-[24px] border border-slate-200/60 border-dashed shadow-sm">
                                <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCart className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-xl mb-2">No listings found</h3>
                                <p className="text-slate-500 mb-6 font-medium">Be the first to list your harvest!</p>
                                <Button onClick={() => setIsListingModalOpen(true)} className="bg-slate-800 text-white hover:bg-slate-900 font-bold rounded-xl px-8 py-6">
                                    Start Selling
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {listings.map((listing) => (
                                    <div key={listing.id} className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col group">
                                        {listing.imageUrl ? (
                                            <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                                                <Image
                                                    src={listing.imageUrl}
                                                    alt={listing.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm">
                                                    {listing.quantity}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-56 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-300 relative">
                                                <Store className="w-16 h-16 opacity-30" />
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm">
                                                    {listing.quantity}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{listing.title}</h3>
                                            
                                            <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">
                                                {listing.description}
                                            </p>

                                            <div className="space-y-5 mt-auto">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-slate-500 font-semibold text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                        <MapPin className="w-3.5 h-3.5 mr-1" />
                                                        {listing.location}
                                                    </div>
                                                    <div className="text-emerald-600 font-black text-xl tracking-tight">
                                                        KES {listing.price.toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                            {listing.seller?.image ? (
                                                                <Image src={listing.seller.image} alt={listing.seller.name || "User"} width={36} height={36} />
                                                            ) : (
                                                                <User className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">
                                                            {listing.seller?.name || "Verified Farmer"}
                                                        </span>
                                                    </div>
                                                    <Button className="rounded-xl px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold" onClick={() => toast.success(`Contacting ${listing.seller?.name || 'Seller'}...`)}>
                                                        Contact
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* === TAB 3: VENDOR NETWORK === */}
                    <TabsContent value="network" className="space-y-6 mt-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-indigo-900 text-white p-8 rounded-[24px] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                            <div className="relative z-10 mb-6 md:mb-0">
                                <h3 className="font-black text-2xl mb-2 flex items-center">
                                    <Network className="mr-2" />
                                    Vendor Match Network
                                </h3>
                                <p className="text-indigo-100/80 font-medium max-w-md">Powered by our Neo4j Knowledge Graph. Find buyers and distributors physically close to you or connected in the supply chain.</p>
                            </div>
                        </div>

                        {loadingVendors ? (
                            <div className="text-center py-20 text-slate-500 font-medium">
                                <div className="h-8 w-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                                Searching Neo4j Database...
                            </div>
                        ) : vendors.length === 0 ? (
                            <div className="text-center py-24 bg-white/60 backdrop-blur-sm rounded-[24px] border border-slate-200/60 border-dashed shadow-sm">
                                <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Network className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-xl mb-2">No vendors found</h3>
                                <p className="text-slate-500 mb-6 font-medium">Make sure the Neo4j database is seeded.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {vendors.map((vendor, idx) => (
                                    <div key={idx} className="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                                                <Store className="w-6 h-6" />
                                            </div>
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${vendor.type === 'Buyer' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {vendor.type}
                                            </span>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-slate-800 mb-1">{vendor.name}</h3>
                                        
                                        <div className="space-y-2 mt-4">
                                            <div className="flex items-center text-slate-500 font-medium text-sm">
                                                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                                Region: <strong className="ml-1 text-slate-700">{vendor.location}</strong>
                                            </div>
                                            <div className="flex items-center text-slate-500 font-medium text-sm">
                                                <Activity className="w-4 h-4 mr-2 text-slate-400" />
                                                Scale: <strong className="ml-1 text-slate-700">{vendor.scale}</strong>
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            onClick={() => setChatVendor(vendor.name)}
                                            className="w-full mt-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Chat with Vendor
                                        </Button>
                                    </div>
                                ))}
                            </div>
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
