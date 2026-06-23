import { NextResponse } from "next/server";

// 2026 Kenyan Market Baselines (KES)
const BASE_PRICES = [
    { id: "maize", crop: "Maize (90kg)", basePrice: 4500, location: "Nairobi", volatility: 50 },
    { id: "beans", crop: "Beans (90kg)", basePrice: 8200, location: "Mombasa", volatility: 80 },
    { id: "potatoes", crop: "Potatoes (50kg)", basePrice: 3500, location: "Nakuru", volatility: 100 },
    { id: "tomatoes", crop: "Tomatoes (crate)", basePrice: 6000, location: "Eldoret", volatility: 150 },
    { id: "onions", crop: "Onions (net)", basePrice: 1200, location: "Kisumu", volatility: 40 },
    { id: "avocado", crop: "Avocado (kg)", basePrice: 80, location: "Meru", volatility: 3 },
];

// In-memory cache to keep state across API calls during the hackathon
let currentPrices = BASE_PRICES.map(item => ({
    id: item.id,
    crop: item.crop,
    location: item.location,
    price: item.basePrice,
    change: 0,
    trend: "up" as "up" | "down"
}));

export async function GET() {
    // Fluctuate prices realistically
    currentPrices = currentPrices.map((item, index) => {
        const base = BASE_PRICES[index];
        // Randomly decide if price goes up or down
        const isUp = Math.random() > 0.5;
        // Random fluctuation amount based on commodity volatility
        const fluctuation = Math.floor(Math.random() * base.volatility);
        
        let newPrice = isUp ? item.price + fluctuation : item.price - fluctuation;
        
        // Prevent prices from deviating wildly from the 2026 baseline (max 15% drift)
        const maxDrift = base.basePrice * 0.15;
        if (newPrice > base.basePrice + maxDrift) newPrice = base.basePrice + maxDrift;
        if (newPrice < base.basePrice - maxDrift) newPrice = base.basePrice - maxDrift;

        const change = newPrice - item.price;

        return {
            ...item,
            price: Math.round(newPrice),
            change: Math.round(change),
            trend: change >= 0 ? "up" : "down"
        };
    });

    return NextResponse.json(currentPrices);
}
