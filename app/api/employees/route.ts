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

        const { name, role, phoneNumber, email } = await req.json();

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
                email,
                farmId: farm.id
            }
        });

        return NextResponse.json(employee);
    } catch (error) {
        console.error("Create Employee Error:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing employee ID" }, { status: 400 });

        // Find the employee first to get their email
        const employee = await db.employee.findUnique({ where: { id } });
        if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

        // Delete them
        await db.employee.delete({ where: { id } });

        // Send Termination Email via Brevo
        if (employee.email && process.env.BREVO_API_KEY) {
            const senderEmail = session.user.email || "manager@example.com";
            try {
                await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "api-key": process.env.BREVO_API_KEY
                    },
                    body: JSON.stringify({
                        sender: { name: "AgriTwin Management", email: senderEmail },
                        to: [{ email: employee.email, name: employee.name }],
                        subject: "Employment Terminated",
                        htmlContent: `
                            <div style="font-family: sans-serif; padding: 20px; background-color: #fef2f2; border-radius: 10px;">
                                <h2 style="color: #b91c1c;">Notice of Termination</h2>
                                <p>Dear ${employee.name},</p>
                                <p>This email is to formally notify you that your employment at the farm has been terminated, effective immediately.</p>
                                <p>Your access to the AgriTwin digital farm dashboard has been revoked.</p>
                                <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Powered by AgriTwin System</p>
                            </div>
                        `
                    })
                });
            } catch (err) {
                console.error("Failed to send termination email", err);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Employee Error:", error);
        return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
    }
}
