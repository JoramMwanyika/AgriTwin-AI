
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { farmName, farmLocation, farmSize, sizeUnit, blocks } = body;

        if (!farmName || !farmSize || !blocks || !Array.isArray(blocks)) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Convert size to a standard unit (e.g., Acres) if needed. 
        // For simplicity, we'll store as is or assume the UI sends a standard number.
        const totalSize = parseFloat(farmSize);

        // Create Farm and Blocks in a transaction
        const farm = await db.farm.create({
            data: {
                userId: session.user.id,
                name: farmName,
                location: farmLocation,
                size: totalSize,
                blocks: {
                    create: blocks.map((block: any, index: number) => {
                        // Calculate simplistic grid position based on index if not provided
                        // We'll create a simple 2x3 or 3x3 grid layout logic here or let UI handle it 
                        // For now, let's just initialize them without specific grid config 
                        // and let the 2D layout engine organize them, or we can pre-calculate.

                        // Let's assign a basic default color/position relative to index
                        const colors = ["primary", "yellow", "brown", "lightgreen", "darkgreen"];
                        const color = colors[index % colors.length];

                        // Simple auto-layout: 2 columns
                        const row = Math.floor(index / 2) + 1;
                        const col = (index % 2) + 1;

                        return {
                            name: block.name,
                            cropType: block.crop,
                            area: parseFloat(block.size),
                            gridConfig: {
                                row: row,
                                col: col,
                                rowSpan: 1,
                                colSpan: 1,
                                color: color
                            }
                        };
                    })
                }
            },
            include: {
                blocks: true
            }
        });

        // Generate simulated sensors and readings for each block so they appear on the dashboard
        for (const block of farm.blocks) {
            const sensor = await db.sensor.create({
                data: {
                    name: `${block.name} Virtual Sensor`,
                    type: "virtual",
                    blockId: block.id,
                }
            });

            await db.sensorReading.create({
                data: {
                    sensorId: sensor.id,
                    blockId: block.id,
                    moisture: Math.floor(40 + Math.random() * 40),
                    temp: Math.floor(20 + Math.random() * 15),
                    humidity: Math.floor(50 + Math.random() * 30),
                    nitrogen: Math.floor(20 + Math.random() * 20),
                    phosphorus: Math.floor(20 + Math.random() * 20),
                    potassium: Math.floor(20 + Math.random() * 20),
                }
            });
        }

        return NextResponse.json({ farm });
    } catch (error) {
        console.error("Onboarding error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
