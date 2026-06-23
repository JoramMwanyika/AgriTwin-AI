import { NextRequest, NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "knowledge"; // "knowledge" or "supply"

    let session;
    try {
        const driver = getNeo4jDriver();
        session = driver.session();

        if (type === "knowledge") {
            // Query Crop Knowledge Graph
            const result = await session.run(`
                MATCH (c:Crop)-[v:VULNERABLE_TO]->(d:Disease)-[t:TREATED_BY]->(tr:Treatment)
                RETURN c.name AS crop, d.name AS disease, d.type AS diseaseType, tr.name AS treatment, tr.method AS method
            `);

            const knowledge = result.records.map(record => ({
                crop: record.get("crop"),
                disease: record.get("disease"),
                diseaseType: record.get("diseaseType"),
                treatment: record.get("treatment"),
                treatmentMethod: record.get("method")
            }));

            return NextResponse.json({ type: "knowledge", data: knowledge });
        } 
        else if (type === "supply") {
            // Query Supply Chain
            const result = await session.run(`
                MATCH (f:Farmer)-[s:SELLS_TO]->(d:Distributor)-[sup:SUPPLIES_TO]->(b:Buyer)
                RETURN f.name AS farmer, s.crop AS crop, s.volume_tons AS volume, d.name AS distributor, b.name AS buyer, b.type AS buyerType
            `);

            const supplyChain = result.records.map(record => ({
                farmer: record.get("farmer"),
                crop: record.get("crop"),
                volumeTons: record.get("volume"),
                distributor: record.get("distributor"),
                buyer: record.get("buyer"),
                buyerType: record.get("buyerType")
            }));

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
