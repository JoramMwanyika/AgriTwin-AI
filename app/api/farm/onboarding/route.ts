
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

        // Convert size to a standard unit
        const totalSize = parseFloat(farmSize) || 0;

        // Create Farm and Blocks in a transaction
        const farm = await db.farm.create({
            data: {
                userId: session.user.id,
                name: farmName,
                location: farmLocation,
                size: totalSize,
                blocks: {
                    create: blocks.map((block: any, index: number) => {
                        const colors = ["primary", "yellow", "brown", "lightgreen", "darkgreen"];
                        const color = colors[index % colors.length];

                        const row = Math.floor(index / 2) + 1;
                        const col = (index % 2) + 1;

                        return {
                            name: block.name,
                            cropType: block.crop,
                            area: parseFloat(block.size) || 0,
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

        // Generate simulated sensors and readings
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
                    timestamp: new Date(),
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
