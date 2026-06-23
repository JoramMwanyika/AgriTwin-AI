import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const farm = await db.farm.findFirst({
            where: { userId: session.user.id }
        });

        if (!farm) return NextResponse.json([]);

        const tasks = await db.task.findMany({
            where: { farmId: farm.id },
            include: {
                assignee: true,
                block: true
            },
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" }
            ]
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Fetch Tasks Error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description, priority, dueDate, employeeId, blockId } = await req.json();

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        let farm = await db.farm.findFirst({
            where: { userId: session.user.id }
        });

        if (!farm) {
            farm = await db.farm.create({
                data: { name: "My Smart Farm", userId: session.user.id }
            });
        }

        const task = await db.task.create({
            data: {
                title,
                description,
                priority: priority || "MEDIUM",
                dueDate: dueDate ? new Date(dueDate) : null,
                employeeId: employeeId || null,
                blockId: blockId || null,
                farmId: farm.id
            },
            include: {
                assignee: true,
                block: true
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error("Create Task Error:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id, status } = await req.json();

        if (!id || !status) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const task = await db.task.update({
            where: { id },
            data: { 
                status,
                completedAt: status === "COMPLETED" ? new Date() : null
            },
            include: {
                assignee: true,
                block: true
            }
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error("Update Task Error:", error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}
