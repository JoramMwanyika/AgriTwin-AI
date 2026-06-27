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
            CREATE (watermelon:Crop {name: 'Watermelon'})
            CREATE (cabbage:Crop {name: 'Cabbage'})
            CREATE (potato:Crop {name: 'Potato'})
            
            // Diseases & Pests
            CREATE (faw:Disease {name: 'Fall Armyworm', type: 'Pest'})
            CREATE (mln:Disease {name: 'Maize Lethal Necrosis', type: 'Virus'})
            CREATE (rust:Disease {name: 'Bean Rust', type: 'Fungus'})
            CREATE (blight:Disease {name: 'Early Blight', type: 'Fungus'})
            CREATE (powdery_mildew:Disease {name: 'Powdery Mildew', type: 'Fungus'})
            CREATE (dbm:Disease {name: 'Diamondback Moth', type: 'Pest'})
            CREATE (late_blight:Disease {name: 'Late Blight', type: 'Fungus'})

            // Treatments / Pesticides
            CREATE (t_faw:Treatment {name: 'Spinetoram 120SC', method: 'Chemical Spray'})
            CREATE (t_rust:Treatment {name: 'Mancozeb 80WP', method: 'Fungicide Spray'})
            CREATE (t_blight:Treatment {name: 'Copper Oxychloride', method: 'Fungicide Spray'})
            CREATE (t_mln:Treatment {name: 'Crop Rotation & Vector Control', method: 'Cultural'})
            CREATE (t_sulfur:Treatment {name: 'Sulfur Fungicide', method: 'Fungicide Spray'})
            CREATE (t_bt:Treatment {name: 'Bacillus thuringiensis (Bt)', method: 'Biological Spray'})
            CREATE (t_late_blight:Treatment {name: 'Chlorothalonil', method: 'Fungicide Spray'})

            // Relationships: Crop -> Disease
            CREATE (maize)-[:VULNERABLE_TO]->(faw)
            CREATE (maize)-[:VULNERABLE_TO]->(mln)
            CREATE (beans)-[:VULNERABLE_TO]->(rust)
            CREATE (tomatoes)-[:VULNERABLE_TO]->(blight)
            CREATE (watermelon)-[:VULNERABLE_TO]->(powdery_mildew)
            CREATE (cabbage)-[:VULNERABLE_TO]->(dbm)
            CREATE (potato)-[:VULNERABLE_TO]->(late_blight)

            // Relationships: Disease -> Treatment
            CREATE (faw)-[:TREATED_BY]->(t_faw)
            CREATE (rust)-[:TREATED_BY]->(t_rust)
            CREATE (blight)-[:TREATED_BY]->(t_blight)
            CREATE (mln)-[:TREATED_BY]->(t_mln)
            CREATE (powdery_mildew)-[:TREATED_BY]->(t_sulfur)
            CREATE (dbm)-[:TREATED_BY]->(t_bt)
            CREATE (late_blight)-[:TREATED_BY]->(t_late_blight)
        `);

        // 2. Seed Companion Planting — ANTAGONIST_TO relationships
        // These are crops that grow poorly when planted adjacent to each other.
        await session.run(`
            MERGE (tomato:Crop {name: 'Tomato'})
            MERGE (fennel:Crop {name: 'Fennel'})
            MERGE (onion:Crop {name: 'Onion'})
            MERGE (bean:Crop {name: 'Bean'})
            MERGE (strawberry:Crop {name: 'Strawberry'})
            MERGE (brassica:Crop {name: 'Brassica'})
            MERGE (garlic:Crop {name: 'Garlic'})
            MERGE (pea:Crop {name: 'Pea'})
            MERGE (pepper:Crop {name: 'Pepper'})
            MERGE (kohlrabi:Crop {name: 'Kohlrabi'})
            MERGE (tomatoes2:Crop {name: 'Tomatoes'})
            MERGE (sunflower:Crop {name: 'Sunflower'})
            MERGE (potato3:Crop {name: 'Potato'})
            MERGE (maize2:Crop {name: 'Maize'})
            MERGE (beans2:Crop {name: 'Beans'})
            MERGE (cabbage2:Crop {name: 'Cabbage'})
            MERGE (watermelon2:Crop {name: 'Watermelon'})

            // Tomato is inhibited by Fennel (fennel releases chemicals toxic to tomatoes)
            MERGE (tomato)-[:ANTAGONIST_TO]->(fennel)
            MERGE (fennel)-[:ANTAGONIST_TO]->(tomato)

            // Onions stunt the growth of Beans and Peas
            MERGE (onion)-[:ANTAGONIST_TO]->(bean)
            MERGE (bean)-[:ANTAGONIST_TO]->(onion)
            MERGE (onion)-[:ANTAGONIST_TO]->(pea)
            MERGE (pea)-[:ANTAGONIST_TO]->(onion)
            MERGE (onion)-[:ANTAGONIST_TO]->(beans2)
            MERGE (beans2)-[:ANTAGONIST_TO]->(onion)

            // Garlic inhibits Beans and Peas
            MERGE (garlic)-[:ANTAGONIST_TO]->(bean)
            MERGE (bean)-[:ANTAGONIST_TO]->(garlic)
            MERGE (garlic)-[:ANTAGONIST_TO]->(beans2)
            MERGE (beans2)-[:ANTAGONIST_TO]->(garlic)

            // Brassicas (e.g. Cabbage) compete with Strawberries
            MERGE (brassica)-[:ANTAGONIST_TO]->(strawberry)
            MERGE (strawberry)-[:ANTAGONIST_TO]->(brassica)
            MERGE (cabbage2)-[:ANTAGONIST_TO]->(strawberry)
            MERGE (strawberry)-[:ANTAGONIST_TO]->(cabbage2)

            // Pepper and Fennel are incompatible
            MERGE (pepper)-[:ANTAGONIST_TO]->(fennel)
            MERGE (fennel)-[:ANTAGONIST_TO]->(pepper)

            // Kohlrabi inhibits Tomatoes
            MERGE (kohlrabi)-[:ANTAGONIST_TO]->(tomatoes2)
            MERGE (tomatoes2)-[:ANTAGONIST_TO]->(kohlrabi)

            // Sunflower inhibits Potato
            MERGE (sunflower)-[:ANTAGONIST_TO]->(potato3)
            MERGE (potato3)-[:ANTAGONIST_TO]->(sunflower)

            // Watermelon and Potato compete for nutrients
            MERGE (watermelon2)-[:ANTAGONIST_TO]->(potato3)
            MERGE (potato3)-[:ANTAGONIST_TO]->(watermelon2)

            // Fennel is broadly antagonistic — also inhibits Maize
            MERGE (fennel)-[:ANTAGONIST_TO]->(maize2)
            MERGE (maize2)-[:ANTAGONIST_TO]->(fennel)
        `);

        // 3. Seed Supply Chain / Market Network
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

        return NextResponse.json({ message: "Neo4j Database Successfully Seeded with Crops, Diseases, Companion Planting Conflicts & Supply Chain!" });
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

// GET alias — allows triggering the seed from the browser or a cron job
export async function GET() {
    return POST();
}
