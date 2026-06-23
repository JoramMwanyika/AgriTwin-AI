import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { type BlockDailyRecommendation } from "@/lib/block-recommendations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const farm = await db.farm.findFirst({
            where: { userId: session.user.id },
            include: {
                blocks: {
                    include: {
                        readings: {
                            orderBy: { timestamp: "desc" },
                            take: 1,
                        },
                        recommendations: {
                            orderBy: { date: "desc" },
                            take: 1
                        }
                    },
                },
            },
        });

        if (!farm) {
            return NextResponse.json({ error: "Farm not found" }, { status: 404 });
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const blocks: BlockDailyRecommendation[] = [];
        const missingBlocks = [];

        for (const block of farm.blocks) {
            const latestRec = block.recommendations[0];
            const reading = block.readings[0] || {};

            // If there's a recommendation from today (or we just use the latest one available if testing)
            if (latestRec && latestRec.content) {
                try {
                    const aiData = JSON.parse(latestRec.content);
                    blocks.push({
                        blockId: block.id,
                        blockName: block.name,
                        currentCrop: block.cropType ?? null,
                        healthScore: aiData.healthScore ?? 75,
                        healthStatus: aiData.healthStatus ?? "good",
                        healthSummary: aiData.healthSummary ?? "No summary provided.",
                        soilMetrics: {
                            moisture: reading.moisture ?? null,
                            temp: reading.temp ?? null,
                            humidity: reading.humidity ?? null,
                            nitrogen: reading.nitrogen ?? null,
                            phosphorus: reading.phosphorus ?? null,
                            potassium: reading.potassium ?? null,
                        },
                        actions: aiData.actions ?? [],
                        suitableCrops: aiData.suitableCrops ?? [],
                    });
                } catch (e) {
                    console.error(`Failed to parse AI JSON for block ${block.id}`);
                    missingBlocks.push(block);
                }
            } else {
                missingBlocks.push(block);
            }
        }

        // FALLBACK: If AI hasn't generated recommendations yet, use the old deterministic engine
        if (missingBlocks.length > 0) {
            const { generateBlockRecommendations } = await import("@/lib/block-recommendations");
            const fallbackData = generateBlockRecommendations(missingBlocks as any);
            blocks.push(...fallbackData);
        }

        const farmHealthScore =
            blocks.length > 0
                ? Math.round(blocks.reduce((s, b) => s + b.healthScore, 0) / blocks.length)
                : 0;

        const criticalBlocks = blocks.filter(
            (b) => b.healthStatus === "poor" || b.healthStatus === "critical",
        );

        return NextResponse.json({
            blocks,
            summary: {
                farmHealthScore,
                farmHealthStatus:
                    farmHealthScore >= 70 ? "good" : farmHealthScore >= 50 ? "fair" : "needs attention",
                blockCount: blocks.length,
                alertCount: criticalBlocks.length,
                alerts: criticalBlocks.map((b) => ({
                    blockName: b.blockName,
                    message: b.actions[0] ?? b.healthSummary,
                })),
            },
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Daily recommendations error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
