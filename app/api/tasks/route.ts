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

        // If an employee was assigned, attempt to send a real email notification via Brevo
        if (task.assignee && process.env.BREVO_API_KEY && task.assignee.email) {
            try {
                // The sender email MUST be the one you verified on your Brevo account.
                // We default to the logged in user's email, fallback to a placeholder.
                const senderEmail = session.user?.email || "sender@example.com"; 
                
                const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "api-key": process.env.BREVO_API_KEY
                    },
                    body: JSON.stringify({
                        sender: { name: "AgriTwin Manager", email: senderEmail },
                        to: [{ email: task.assignee.email, name: task.assignee.name }],
                        subject: `New Farm Task: ${task.title}`,
                        htmlContent: `
                            <div style="font-family: sans-serif; padding: 20px; background-color: #f0fdf4; border-radius: 10px;">
                                <h2 style="color: #047857;">New Task Assigned! 🌱</h2>
                                <p><strong>Employee:</strong> ${task.assignee.name}</p>
                                <p><strong>Task:</strong> ${task.title}</p>
                                <p><strong>Priority:</strong> ${task.priority}</p>
                                ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                                <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Powered by AgriTwin Digital Farm</p>
                            </div>
                        `
                    })
                });
                
                if (response.ok) {
                    console.log("Brevo email dispatched successfully!");
                } else {
                    const errorText = await response.text();
                    console.error("Brevo email failed:", errorText);
                }
            } catch (emailError) {
                console.error("Failed to send Brevo email:", emailError);
            }
        }

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

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing task ID" }, { status: 400 });

        await db.task.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Task Error:", error);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
