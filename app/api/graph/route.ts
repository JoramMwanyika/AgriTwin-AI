import { NextRequest, NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateCropKnowledge } from "@/lib/ai";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "knowledge"; // "knowledge" or "supply"

    // Get authenticated user and their crops
    const sessionAuth = await auth();
    const userId = sessionAuth?.user?.id;
    
    let cropNames: string[] = [];
    if (userId) {
        const userBlocks = await db.block.findMany({
            where: { farm: { userId } },
            select: { cropType: true }
        });
        cropNames = Array.from(new Set(userBlocks.map(b => b.cropType).filter(Boolean))) as string[];
    }

    let session;
    try {
        const driver = getNeo4jDriver();
        session = driver.session();

        if (type === "knowledge") {
            // Query Crop Knowledge Graph
            let query = `
                MATCH (c:Crop)-[v:VULNERABLE_TO]->(d:Disease)-[t:TREATED_BY]->(tr:Treatment)
                RETURN c.name AS crop, d.name AS disease, d.type AS diseaseType, tr.name AS treatment, tr.method AS method
            `;
            let params: any = {};

            // If we have a logged-in user, filter the graph by their planted crops
            if (userId) {
                if (cropNames.length > 0) {
                    const lowerCrops = cropNames.map(c => c.toLowerCase());
                    query = `
                        MATCH (c:Crop)-[v:VULNERABLE_TO]->(d:Disease)-[t:TREATED_BY]->(tr:Treatment)
                        WHERE toLower(c.name) IN $lowerCrops
                        RETURN c.name AS crop, d.name AS disease, d.type AS diseaseType, tr.name AS treatment, tr.method AS method
                    `;
                    params = { lowerCrops };
                } else {
                    // Authenticated but no crops planted, return empty or we could return all
                    // But requirement says: "knowledge graph should be according to what the farmer has planted in his farm"
                    return NextResponse.json({ type: "knowledge", data: [] });
                }
            }

            const result = await session.run(query, params);

            const knowledge = result.records.map(record => ({
                crop: record.get("crop"),
                disease: record.get("disease"),
                diseaseType: record.get("diseaseType"),
                treatment: record.get("treatment"),
                treatmentMethod: record.get("method")
            }));

            // Auto-generate missing crops using AI
            if (userId && cropNames.length > 0) {
                const returnedCrops = new Set(knowledge.map(k => k.crop.toLowerCase()));
                const missingCrops = cropNames.filter(c => !returnedCrops.has(c.toLowerCase()));

                for (const crop of missingCrops) {
                    try {
                        const aiData = await generateCropKnowledge(crop);
                        
                        if (aiData) {
                            if (aiData.relationships && Array.isArray(aiData.relationships)) {
                                for (const rel of aiData.relationships) {
                                    // Insert into Neo4j
                                    await session.run(`
                                        MERGE (c:Crop {name: $cropName})
                                        MERGE (d:Disease {name: $disease, type: $type})
                                        MERGE (t:Treatment {name: $treatment, method: $method})
                                        MERGE (c)-[:VULNERABLE_TO]->(d)
                                        MERGE (d)-[:TREATED_BY]->(t)
                                    `, {
                                        cropName: crop,
                                        disease: rel.disease_name,
                                        type: rel.disease_type,
                                        treatment: rel.treatment_name,
                                        method: rel.treatment_method
                                    });
                                    
                                    // Add to current response
                                    knowledge.push({
                                        crop: crop,
                                        disease: rel.disease_name,
                                        diseaseType: rel.disease_type,
                                        treatment: rel.treatment_name,
                                        treatmentMethod: rel.treatment_method
                                    });
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to generate knowledge for crop ${crop}:`, err);
                    }
                }
            }

            return NextResponse.json({ type: "knowledge", data: knowledge });
        } 
        else if (type === "supply") {
            // Query Supply Chain
            let query = `
                MATCH (f:Farmer)-[s:SELLS_TO]->(d:Distributor)-[sup:SUPPLIES_TO]->(b:Buyer)
                RETURN f.name AS farmer, s.crop AS crop, s.volume_tons AS volume, d.name AS distributor, b.name AS buyer, b.type AS buyerType
            `;
            let params: any = {};
            
            // For supply chain, if they want it filtered by their crops too, we can add it here.
            // Requirement said "knowledge graph should be according to what the farmer has planted".
            // It might just mean the crop knowledge, but let's filter supply chain as well if they want it.
            // Actually, supply chain shows their trace. Let's just filter the knowledge graph, as "knowledge graph" refers to crop vulnerability/treatments.
            
            const result = await session.run(query, params);

            const supplyChain = result.records.map(record => {
                const vol = record.get("volume");
                return {
                    farmer: record.get("farmer"),
                    crop: record.get("crop"),
                    volumeTons: vol && vol.toNumber ? vol.toNumber() : Number(vol),
                    distributor: record.get("distributor"),
                    buyer: record.get("buyer"),
                    buyerType: record.get("buyerType")
                };
            });

            return NextResponse.json({ type: "supply", data: supplyChain });
        }
        else {
            return NextResponse.json({ error: "Invalid type parameter. Use ?type=knowledge or ?type=supply" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Neo4j Query Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch graph data", details: error.message },
            { status: 500 }
        );
    } finally {
        if (session) {
            await session.close();
        }
    }
}
