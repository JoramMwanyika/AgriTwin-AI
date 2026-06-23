require("dotenv").config({ path: ".env.local" });
const neo4j = require("neo4j-driver");

async function seed() {
    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER || process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
        console.error("Missing Neo4j credentials in .env.local");
        process.exit(1);
    }

    console.log(`Connecting to Neo4j at ${uri}...`);
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        console.log("Clearing existing data...");
        await session.run(`MATCH (n) DETACH DELETE n`);

        console.log("Seeding Crop Knowledge Graph...");
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

        console.log("Seeding Supply Chain Graph...");
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

        console.log("Successfully seeded Neo4j!");
    } catch (err) {
        console.error("Error seeding Neo4j:", err);
    } finally {
        await session.close();
        await driver.close();
    }
}

seed();
