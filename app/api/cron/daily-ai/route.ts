import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAiRecommendationForBlock } from "@/lib/ai-recommendations";

export async function GET(req: Request) {
    try {
        const blocks = await db.block.findMany({
            include: {
                readings: {
                    orderBy: { timestamp: "desc" },
                    take: 1
                }
            }
        });

        // Get the start of today (midnight)
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let generatedCount = 0;

        for (const block of blocks) {
            // Check if recommendation already exists for today
            const existingRec = await db.dailyRecommendation.findFirst({
                where: {
                    blockId: block.id,
                    date: {
                        gte: startOfToday
                    }
                }
            });

            if (!existingRec) {
                console.log(`[Cron] Generating AI recommendation for block: ${block.name}`);
                
                const reading = block.readings[0] || {};
                const aiResult = await generateAiRecommendationForBlock(
                    block.name,
                    block.cropType || null,
                    reading.moisture ?? null,
                    reading.temp ?? null,
                    reading.nitrogen ?? null,
                    reading.phosphorus ?? null,
                    reading.potassium ?? null
                );

                // Save to Database
                await db.dailyRecommendation.create({
                    data: {
                        blockId: block.id,
                        date: now,
                        content: JSON.stringify(aiResult),
                        type: "ai-generated"
                    }
                });

                generatedCount++;
            }
        }

        return NextResponse.json({ 
            message: "Daily AI Cron executed", 
            generated: generatedCount 
        });

    } catch (error) {
        console.error("AI Cron Error:", error);
        return NextResponse.json({ error: "Failed to run AI cron" }, { status: 500 });
    }
}
