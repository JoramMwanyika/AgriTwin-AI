import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateCropKnowledge } from "@/lib/ai";
import { getNeo4jDriver } from "@/lib/neo4j";

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { layout, blocks } = body;

        if (!layout || !blocks || !Array.isArray(blocks)) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 1. Get the user's farm
        const farm = await db.farm.findFirst({
            where: { userId: session.user.id },
            include: { blocks: true }
        });

        if (!farm) {
            return NextResponse.json({ error: "Farm not found" }, { status: 404 });
        }

        // 2. Perform updates in a transaction
        await db.$transaction(async (tx) => {
            // Update farm layout
            await tx.farm.update({
                where: { id: farm.id },
                data: { layout }
            });

            const incomingIds = blocks
                .map((b: any) => b.id)
                .filter((id: any) => typeof id === 'string' && !id.toString().startsWith('temp-'));

            // Delete blocks that are no longer in the payload
            const blocksToDelete = farm.blocks.filter(b => !incomingIds.includes(b.id));
            if (blocksToDelete.length > 0) {
                await tx.block.deleteMany({
                    where: { id: { in: blocksToDelete.map(b => b.id) } }
                });
            }

            // Update or Create blocks
            for (const b of blocks) {
                const isTemp = typeof b.id === 'number' || (typeof b.id === 'string' && b.id.toString().startsWith('temp-'));
                
                const blockData = {
                    name: b.blockName,
                    cropType: b.cropName,
                    gridConfig: {
                        row: b.gridPosition.row,
                        col: b.gridPosition.col,
                        rowSpan: b.gridPosition.rowSpan,
                        colSpan: b.gridPosition.colSpan,
                        color: b.color
                    }
                };

                if (isTemp) {
                    // Create new block
                    const newBlock = await tx.block.create({
                        data: {
                            farmId: farm.id,
                            ...blockData
                        }
                    });

                    // Auto-generate a virtual sensor for new blocks
                    await tx.sensor.create({
                        data: {
                            name: `${b.blockName} Virtual Sensor`,
                            type: "virtual",
                            blockId: newBlock.id,
                        }
                    });

                    // Trigger background Neo4j seeding for the new crop
                    if (b.cropName) {
                        seedCropToNeo4jBackground(b.cropName);
                    }
                } else {
                    // Update existing block
                    await tx.block.update({
                        where: { id: b.id },
                        data: blockData
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update layout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function seedCropToNeo4jBackground(cropName: string) {
    // Run asynchronously, do not block the request
    (async () => {
        let session;
        try {
            const aiData = await generateCropKnowledge(cropName);
            if (aiData && aiData.relationships && Array.isArray(aiData.relationships)) {
                const driver = getNeo4jDriver();
                session = driver.session();
                for (const rel of aiData.relationships) {
                    await session.run(`
                        MERGE (c:Crop {name: $cropName})
                        MERGE (d:Disease {name: $disease, type: $type})
                        MERGE (t:Treatment {name: $treatment, method: $method})
                        MERGE (c)-[:VULNERABLE_TO]->(d)
                        MERGE (d)-[:TREATED_BY]->(t)
                    `, {
                        cropName: cropName,
                        disease: rel.disease_name,
                        type: rel.disease_type,
                        treatment: rel.treatment_name,
                        method: rel.treatment_method
                    });
                }
                console.log(`[Neo4j] Successfully seeded knowledge for new crop: ${cropName}`);
            }
        } catch (err) {
            console.error(`[Neo4j] Background seeding error for crop ${cropName}:`, err);
        } finally {
            if (session) await session.close();
        }
    })();
}
