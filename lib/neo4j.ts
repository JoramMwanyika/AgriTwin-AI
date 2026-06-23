import neo4j, { Driver } from "neo4j-driver";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver {
    if (driver) {
        return driver;
    }

    const uri = process.env.NEO4J_URI;
    const user = process.env.NEO4J_USER || process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !user || !password) {
        console.warn("Neo4j credentials are not set in environment variables.");
        // We will throw an error when they try to actually connect, but return a dummy/nullish driver here if possible?
        // Let's just throw, because without a driver the app shouldn't try to query Neo4j.
        throw new Error("Neo4j is not configured. Please add NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD to your .env.local file.");
    }

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
    });

    return driver;
}

export async function closeNeo4jDriver() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}
