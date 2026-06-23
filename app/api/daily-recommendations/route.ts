import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  generateBlockRecommendations,
  type BlockDailyRecommendation,
} from "@/lib/block-recommendations"

const DEMO_BLOCKS: BlockDailyRecommendation[] = [
  {
    blockId: "demo-a",
    blockName: "North Field",
    currentCrop: "Maize",
    healthScore: 82,
    healthStatus: "good",
    healthSummary:
      "North Field soil health is good (82%). Moisture 65%, temp 28°C, NPK 42/32/28. Conditions suit maize well.",
    soilMetrics: {
      moisture: 65,
      temp: 28,
      humidity: 55,
      nitrogen: 42,
      phosphorus: 32,
      potassium: 28,
    },
    actions: ["Maintain light irrigation for maize in North Field."],
    suitableCrops: [
      { name: "Maize (Mahindi)", score: 88, reason: "moisture match, temperature match" },
      { name: "Beans (Maharagwe)", score: 72, reason: "NPK balance suits this crop" },
      { name: "Kale (Sukuma Wiki)", score: 68, reason: "Fast-growing leafy crop" },
    ],
  },
  {
    blockId: "demo-b",
    blockName: "Block B",
    currentCrop: "Beans",
    healthScore: 48,
    healthStatus: "poor",
    healthSummary:
      "Block B soil health is poor (48%). Moisture 25%, temp 26°C, NPK 28/38/32. Adjust irrigation before the next planting window.",
    soilMetrics: {
      moisture: 25,
      temp: 26,
      humidity: 48,
      nitrogen: 28,
      phosphorus: 38,
      potassium: 32,
    },
    actions: [
      "Irrigate Block B soon — soil moisture is low at 25% (target 40–65%).",
      "Monitor Block B beans for fungal spots in humid conditions.",
      "For rotation or replanting in Block B, consider: Onions (Kitunguu), Beans (Maharagwe), Kale (Sukuma Wiki).",
    ],
    suitableCrops: [
      { name: "Onions (Kitunguu)", score: 75, reason: "Lower moisture; good for drier blocks" },
      { name: "Beans (Maharagwe)", score: 70, reason: "Fixes nitrogen; suits moderate moisture" },
      { name: "Kale (Sukuma Wiki)", score: 65, reason: "Tolerates varied soils" },
    ],
  },
  {
    blockId: "demo-g",
    blockName: "Greenhouse 1",
    currentCrop: "Tomatoes",
    healthScore: 76,
    healthStatus: "good",
    healthSummary:
      "Greenhouse 1 soil health is good (76%). Moisture 65%, temp 24°C, NPK 48/42/44. Conditions suit tomatoes well.",
    soilMetrics: {
      moisture: 65,
      temp: 24,
      humidity: 72,
      nitrogen: 48,
      phosphorus: 42,
      potassium: 44,
    },
    actions: ["Ventilate Greenhouse 1 — humidity 72% increases fungal risk."],
    suitableCrops: [
      { name: "Tomatoes (Nyanya)", score: 90, reason: "Higher moisture and potassium; greenhouse-friendly" },
      { name: "Cabbage (Kabichi)", score: 78, reason: "Cooler temps and consistent moisture" },
      { name: "Kale (Sukuma Wiki)", score: 74, reason: "Fast-growing leafy crop" },
    ],
  },
]

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
          },
        },
      },
    })

    if (!farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 })
    }

    const blocks = generateBlockRecommendations(farm.blocks)

    const farmHealthScore =
      blocks.length > 0
        ? Math.round(blocks.reduce((s, b) => s + b.healthScore, 0) / blocks.length)
        : 0

    const criticalBlocks = blocks.filter(
      (b) => b.healthStatus === "poor" || b.healthStatus === "critical",
    )

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
    })
  } catch (error) {
    console.error("Daily recommendations error:", error)
    const farmHealthScore = Math.round(
      DEMO_BLOCKS.reduce((s, b) => s + b.healthScore, 0) / DEMO_BLOCKS.length,
    )
    return NextResponse.json({
      blocks: DEMO_BLOCKS,
      summary: {
        farmHealthScore,
        farmHealthStatus: "good",
        blockCount: DEMO_BLOCKS.length,
        alertCount: 1,
        alerts: [{ blockName: "Block B", message: DEMO_BLOCKS[1].actions[0] }],
      },
      generatedAt: new Date().toISOString(),
      demo: true,
    })
  }
}
