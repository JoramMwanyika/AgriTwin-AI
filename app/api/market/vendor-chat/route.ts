import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET messages for a specific vendor
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const vendorName = url.searchParams.get("vendorName");

        if (!vendorName) {
            return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
        }

        const messages = await db.vendorMessage.findMany({
            where: {
                userId: session.user.id,
                vendorName: vendorName
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Vendor chat fetch error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST a new message to a vendor
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { vendorName, content } = body;

        if (!vendorName || !content) {
            return NextResponse.json({ error: "Vendor name and content are required" }, { status: 400 });
        }

        // Save user message
        const userMsg = await db.vendorMessage.create({
            data: {
                userId: session.user.id,
                vendorName: vendorName,
                content: content,
                isFromUser: true
            }
        });

        // Mock an automated reply from the vendor after 1 second for demo purposes
        // In a real app, this would be handled asynchronously by a vendor dashboard or websocket
        setTimeout(async () => {
            try {
                await db.vendorMessage.create({
                    data: {
                        userId: session.user.id,
                        vendorName: vendorName,
                        content: `Hi, this is an automated response from ${vendorName}. We have received your message regarding: "${content.substring(0, 30)}...". Our procurement team will review and get back to you shortly.`,
                        isFromUser: false
                    }
                });
            } catch (err) {
                console.error("Failed to save automated reply", err);
            }
        }, 1500);

        return NextResponse.json(userMsg);
    } catch (error) {
        console.error("Vendor chat send error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
