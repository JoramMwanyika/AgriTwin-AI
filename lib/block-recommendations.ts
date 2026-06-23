/** Per-block daily recommendations from sensor readings and soil health */

export type SoilReading = {
  moisture?: number | null
  temp?: number | null
  humidity?: number | null
  nitrogen?: number | null
  phosphorus?: number | null
  potassium?: number | null
}

export type FarmBlockInput = {
  id: string
  name: string
  cropType?: string | null
  status?: string | null
  readings?: SoilReading[]
}

export type SuitableCrop = {
  name: string
  score: number
  reason: string
}

export type BlockDailyRecommendation = {
  blockId: string
  blockName: string
  currentCrop: string | null
  healthScore: number
  healthStatus: "excellent" | "good" | "fair" | "poor" | "critical"
  healthSummary: string
  soilMetrics: {
    moisture: number | null
    temp: number | null
    humidity: number | null
    nitrogen: number | null
    phosphorus: number | null
    potassium: number | null
  }
  actions: string[]
  suitableCrops: SuitableCrop[]
}

type CropProfile = {
  name: string
  idealMoisture: [number, number]
  idealTemp: [number, number]
  idealN: [number, number]
  idealP: [number, number]
  idealK: [number, number]
  blurb: string
}

const CROP_PROFILES: CropProfile[] = [
  {
    name: "Maize (Mahindi)",
    idealMoisture: [45, 70],
    idealTemp: [18, 30],
    idealN: [35, 55],
    idealP: [25, 45],
    idealK: [20, 40],
    blurb: "Needs steady moisture during tasseling; moderate NPK.",
  },
  {
    name: "Beans (Maharagwe)",
    idealMoisture: [40, 65],
    idealTemp: [15, 27],
    idealN: [20, 40],
    idealP: [30, 50],
    idealK: [25, 45],
    blurb: "Fixes nitrogen; suits soils with moderate moisture.",
  },
  {
    name: "Tomatoes (Nyanya)",
    idealMoisture: [55, 75],
    idealTemp: [18, 26],
    idealN: [40, 60],
    idealP: [35, 55],
    idealK: [35, 55],
    blurb: "Higher moisture and potassium; greenhouse-friendly.",
  },
  {
    name: "Kale (Sukuma Wiki)",
    idealMoisture: [50, 70],
    idealTemp: [15, 25],
    idealN: [45, 65],
    idealP: [30, 50],
    idealK: [30, 50],
    blurb: "Fast-growing leafy crop; tolerates varied soils.",
  },
  {
    name: "Cabbage (Kabichi)",
    idealMoisture: [55, 75],
    idealTemp: [15, 22],
    idealN: [40, 60],
    idealP: [35, 55],
    idealK: [35, 55],
    blurb: "Cooler temps and consistent moisture.",
  },
  {
    name: "Potatoes (Viazi)",
    idealMoisture: [50, 68],
    idealTemp: [15, 22],
    idealN: [35, 50],
    idealP: [40, 60],
    idealK: [40, 60],
    blurb: "Well-drained soil; strong phosphorus demand.",
  },
  {
    name: "Onions (Kitunguu)",
    idealMoisture: [40, 60],
    idealTemp: [16, 24],
    idealN: [30, 45],
    idealP: [35, 50],
    idealK: [30, 45],
    blurb: "Lower moisture; good for drier blocks.",
  },
]

function inferNpk(block: FarmBlockInput, reading: SoilReading): {
  n: number
  p: number
  k: number
} {
  if (
    reading.nitrogen != null &&
    reading.phosphorus != null &&
    reading.potassium != null
  ) {
    return { n: reading.nitrogen, p: reading.phosphorus, k: reading.potassium }
  }

  const crop = (block.cropType || block.name).toLowerCase()
  if (crop.includes("maize") || crop.includes("north")) return { n: 42, p: 32, k: 28 }
  if (crop.includes("bean") || crop.includes("block b")) return { n: 28, p: 38, k: 32 }
  if (crop.includes("tomato") || crop.includes("greenhouse")) return { n: 48, p: 42, k: 44 }
  if (crop.includes("kale") || crop.includes("sukuma")) return { n: 50, p: 36, k: 38 }
  return { n: 38, p: 34, k: 30 }
}

function inRange(value: number, [min, max]: [number, number]): boolean {
  return value >= min && value <= max
}

function rangeScore(value: number, [min, max]: [number, number], weight: number): number {
  if (inRange(value, [min, max])) return weight
  const dist = value < min ? min - value : value - max
  if (dist <= 10) return weight * 0.5
  if (dist <= 20) return weight * 0.25
  return 0
}

function scoreCropForSoil(
  crop: CropProfile,
  moisture: number,
  temp: number,
  n: number,
  p: number,
  k: number,
): { score: number; reason: string } {
  let score = 0
  const parts: string[] = []

  score += rangeScore(moisture, crop.idealMoisture, 30)
  if (inRange(moisture, crop.idealMoisture)) parts.push("moisture match")

  score += rangeScore(temp, crop.idealTemp, 25)
  if (inRange(temp, crop.idealTemp)) parts.push("temperature match")

  score += rangeScore(n, crop.idealN, 15)
  score += rangeScore(p, crop.idealP, 15)
  score += rangeScore(k, crop.idealK, 15)

  if (inRange(n, crop.idealN) && inRange(p, crop.idealP) && inRange(k, crop.idealK)) {
    parts.push("NPK balance suits this crop")
  }

  const reason =
    parts.length > 0
      ? `${parts.join(", ")} — ${crop.blurb}`
      : crop.blurb

  return { score, reason }
}

function healthStatusFromScore(score: number): BlockDailyRecommendation["healthStatus"] {
  if (score >= 85) return "excellent"
  if (score >= 70) return "good"
  if (score >= 55) return "fair"
  if (score >= 40) return "poor"
  return "critical"
}

function healthStatusLabel(status: BlockDailyRecommendation["healthStatus"]): string {
  const labels: Record<BlockDailyRecommendation["healthStatus"], string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    critical: "Critical",
  }
  return labels[status]
}

export function generateBlockRecommendations(
  blocks: FarmBlockInput[],
): BlockDailyRecommendation[] {
  return blocks.map((block) => {
    const reading = block.readings?.[0] ?? {}
    const moisture = reading.moisture ?? null
    const temp = reading.temp ?? null
    const humidity = reading.humidity ?? null
    const { n, p, k } = inferNpk(block, reading)

    let healthScore = 72
    const actions: string[] = []
    const isGreenhouse = block.name.toLowerCase().includes("greenhouse")

    if (moisture != null) {
      if (moisture < 35) {
        healthScore -= 25
        actions.push(
          `Irrigate ${block.name} soon — soil moisture is low at ${moisture}% (target 40–65%).`,
        )
      } else if (moisture > 75) {
        healthScore -= 15
        actions.push(
          `Delay irrigation in ${block.name} — moisture is high at ${moisture}%; improve drainage if waterlogged.`,
        )
      } else if (moisture >= 40 && moisture <= 65) {
        healthScore += 10
      }

      if (isGreenhouse && humidity != null && humidity > 65) {
        healthScore -= 10
        actions.push(`Ventilate ${block.name} — humidity ${humidity}% increases fungal risk.`)
      }
    } else {
      actions.push(`Install or check moisture sensors in ${block.name} for accurate advice.`)
      healthScore -= 10
    }

    if (temp != null) {
      if (temp > 32) {
        healthScore -= 12
        actions.push(`Shade or irrigate ${block.name} — temperature ${temp}°C is high for most crops.`)
      } else if (temp < 14) {
        healthScore -= 8
        actions.push(`Protect ${block.name} from cold — ${temp}°C may slow growth.`)
      }
    }

    if (n < 30) {
      healthScore -= 8
      actions.push(
        `Boost nitrogen in ${block.name} (N=${n}) — consider legumes next season or nitrogen-rich fertilizer.`,
      )
    }
    if (p < 25) {
      healthScore -= 5
      actions.push(`Add phosphorus in ${block.name} (P=${p}) — important for root and fruit development.`)
    }
    if (k < 20) {
      healthScore -= 5
      actions.push(`Increase potassium in ${block.name} (K=${k}) — supports disease resistance and fruit quality.`)
    }

    const cropLower = (block.cropType || "").toLowerCase()
    if (cropLower.includes("bean") && moisture != null && moisture > 60) {
      actions.push(`Monitor ${block.name} beans for fungal spots in humid conditions.`)
    }

    if (actions.length === 0 && block.cropType) {
      actions.push(
        `Maintain current care for ${block.cropType} in ${block.name} — soil readings are within a healthy range.`,
      )
    } else if (actions.length === 0) {
      actions.push(`Soil in ${block.name} is stable — good time to plan your next planting.`)
    }

    healthScore = Math.max(15, Math.min(98, Math.round(healthScore)))

    const m = moisture ?? 55
    const t = temp ?? 24

    const suitableCrops = CROP_PROFILES.map((crop) => {
      const { score, reason } = scoreCropForSoil(crop, m, t, n, p, k)
      return { name: crop.name, score, reason }
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter((c) => c.score >= 35)

    const status = healthStatusFromScore(healthScore)
    const topCrop = suitableCrops[0]?.name ?? "seasonal vegetables"
    const healthSummary =
      moisture != null
        ? `${block.name} soil health is ${healthStatusLabel(status).toLowerCase()} (${healthScore}%). ` +
          `Moisture ${moisture}%, temp ${temp ?? "—"}°C, NPK ${n}/${p}/${k}. ` +
          (status === "good" || status === "excellent"
            ? `Conditions suit ${block.cropType || "current crops"} well.`
            : `Adjust irrigation or nutrients before the next planting window.`)
        : `${block.name}: limited sensor data — ${healthStatusLabel(status)} overall. Add readings for precise advice.`

    if (suitableCrops.length > 0 && !block.cropType) {
      actions.push(`Best match to plant now: ${topCrop}.`)
    } else if (suitableCrops.length > 0 && status !== "excellent") {
      actions.push(
        `For rotation or replanting in ${block.name}, consider: ${suitableCrops.map((c) => c.name).join(", ")}.`,
      )
    }

    return {
      blockId: block.id,
      blockName: block.name,
      currentCrop: block.cropType ?? null,
      healthScore,
      healthStatus: status,
      healthSummary,
      soilMetrics: {
        moisture,
        temp,
        humidity,
        nitrogen: n,
        phosphorus: p,
        potassium: k,
      },
      actions: actions.slice(0, 4),
      suitableCrops,
    }
  })
}

export function recommendationsToSpeechText(blocks: BlockDailyRecommendation[]): string {
  if (blocks.length === 0) return "No block recommendations available today."
  return blocks
    .map((b) => {
      const crops = b.suitableCrops.map((c) => c.name).join(", ")
      return `${b.blockName}: ${b.healthSummary} Actions: ${b.actions.join(" ")} Suitable crops: ${crops}.`
    })
    .join(" ")
}
