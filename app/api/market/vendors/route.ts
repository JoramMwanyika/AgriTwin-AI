import { NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";

export async function GET() {
    try {
        const driver = getNeo4jDriver();
        const session = driver.session();

        // Fetch all distributors and buyers
        const result = await session.run(`
            MATCH (v) 
            WHERE v:Distributor OR v:Buyer 
            RETURN v 
            LIMIT 50
        `);

        const vendors = result.records.map(record => {
            const node = record.get('v');
            return {
                id: node.elementId,
                name: node.properties.name,
                type: node.labels.includes('Distributor') ? 'Distributor' : 'Buyer',
                location: node.properties.region || node.properties.location || 'Nationwide',
                scale: node.properties.type || 'Standard',
            };
        });

        await session.close();

        return NextResponse.json(vendors);
    } catch (error) {
        console.error("Neo4j fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch vendors from Neo4j" }, { status: 500 });
    }
}
