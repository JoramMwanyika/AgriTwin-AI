import { NextResponse } from "next/server";
import { getNeo4jDriver } from "@/lib/neo4j";

export async function POST() {
    let session;
    try {
        const driver = getNeo4jDriver();
        session = driver.session();

        // Warning: This clears the entire Neo4j database before seeding! 
        // This is safe for hackathons/sandbox DBs but dangerous in prod.
        await session.run(`MATCH (n) DETACH DELETE n`);

        // 1. Seed Crop Knowledge Graph
        await session.run(`
            // Crops
            CREATE (maize:Crop {name: 'Maize'})
            CREATE (beans:Crop {name: 'Beans'})
            CREATE (tomatoes:Crop {name: 'Tomatoes'})
            
            // Diseases & Pests
            CREATE (faw:Disease {name: 'Fall Armyworm', type: 'Pest'})
            CREATE (mln:Disease {name: 'Maize Lethal Necrosis', type: 'Virus'})
            CREATE (rust:Disease {name: 'Bean Rust', type: 'Fungus'})
            CREATE (blight:Disease {name: 'Early Blight', type: 'Fungus'})

            // Treatments / Pesticides
            CREATE (t_faw:Treatment {name: 'Spinetoram 120SC', method: 'Chemical Spray'})
            CREATE (t_rust:Treatment {name: 'Mancozeb 80WP', method: 'Fungicide Spray'})
            CREATE (t_blight:Treatment {name: 'Copper Oxychloride', method: 'Fungicide Spray'})
            CREATE (t_mln:Treatment {name: 'Crop Rotation & Vector Control', method: 'Cultural'})

            // Relationships: Crop -> Disease
            CREATE (maize)-[:VULNERABLE_TO]->(faw)
            CREATE (maize)-[:VULNERABLE_TO]->(mln)
            CREATE (beans)-[:VULNERABLE_TO]->(rust)
            CREATE (tomatoes)-[:VULNERABLE_TO]->(blight)

            // Relationships: Disease -> Treatment
            CREATE (faw)-[:TREATED_BY]->(t_faw)
            CREATE (rust)-[:TREATED_BY]->(t_rust)
            CREATE (blight)-[:TREATED_BY]->(t_blight)
            CREATE (mln)-[:TREATED_BY]->(t_mln)
        `);

        // 2. Seed Supply Chain / Market Network
        await session.run(`
            // Farmers (Producers)
            CREATE (f1:Farmer {name: 'Joram Mwanyika', location: 'Nairobi', scale: 'Medium'})
            CREATE (f2:Farmer {name: 'Alice Wanjiku', location: 'Kiambu', scale: 'Small'})
            CREATE (f3:Farmer {name: 'David Ochieng', location: 'Nakuru', scale: 'Large'})

            // Intermediaries (Distributors / Aggregators)
            CREATE (d1:Distributor {name: 'FreshProduce Logistics', region: 'Central'})
            CREATE (d2:Distributor {name: 'AgroConnect Ltd', region: 'Rift Valley'})

            // Buyers (Retailers / Markets)
            CREATE (b1:Buyer {name: 'Nairobi Mega Market', type: 'Retail'})
            CREATE (b2:Buyer {name: 'FreshMart Supermarkets', type: 'Supermarket'})
            CREATE (b3:Buyer {name: 'Export Grocers Co.', type: 'Export'})

            // Relationships: Farmer -> Distributor
            CREATE (f1)-[:SELLS_TO {crop: 'Tomatoes', volume_tons: 5}]->(d1)
            CREATE (f2)-[:SELLS_TO {crop: 'Beans', volume_tons: 2}]->(d1)
            CREATE (f3)-[:SELLS_TO {crop: 'Maize', volume_tons: 20}]->(d2)
            CREATE (f1)-[:SELLS_TO {crop: 'Maize', volume_tons: 10}]->(d2)

            // Relationships: Distributor -> Buyer
            CREATE (d1)-[:SUPPLIES_TO {margin: '12%'}]->(b1)
            CREATE (d1)-[:SUPPLIES_TO {margin: '15%'}]->(b2)
            CREATE (d2)-[:SUPPLIES_TO {margin: '10%'}]->(b1)
            CREATE (d2)-[:SUPPLIES_TO {margin: '20%'}]->(b3)
        `);

        return NextResponse.json({ message: "Neo4j Database Successfully Seeded!" });
    } catch (error: any) {
        console.error("Neo4j Seeding Error:", error);
        return NextResponse.json(
            { error: "Failed to seed database", details: error.message },
            { status: 500 }
        );
    } finally {
        if (session) {
            await session.close();
        }
    }
}
