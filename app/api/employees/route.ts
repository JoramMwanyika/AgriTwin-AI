import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the user's first farm
        const farm = await db.farm.findFirst({
            where: { userId: session.user.id }
        });

        if (!farm) {
            return NextResponse.json([]);
        }

        const employees = await db.employee.findMany({
            where: { farmId: farm.id },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error("Fetch Employees Error:", error);
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, role, phoneNumber } = await req.json();

        if (!name || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get user's farm or create one if none exists (for hackathon fallback)
        let farm = await db.farm.findFirst({
            where: { userId: session.user.id }
        });

        if (!farm) {
            farm = await db.farm.create({
                data: {
                    name: "My Smart Farm",
                    userId: session.user.id
                }
            });
        }

        const employee = await db.employee.create({
            data: {
                name,
                role,
                phoneNumber,
                farmId: farm.id
            }
        });

        return NextResponse.json(employee);
    } catch (error) {
        console.error("Create Employee Error:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
